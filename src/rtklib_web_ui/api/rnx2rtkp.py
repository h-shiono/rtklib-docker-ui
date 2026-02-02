"""API endpoints for rnx2rtkp post-processing."""

import asyncio
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from rtklib_web_ui.services import ws_manager
from rtklib_web_ui.services.rnx2rtkp_service import (
    Rnx2RtkpConfig,
    Rnx2RtkpInputFiles,
    Rnx2RtkpJob,
    Rnx2RtkpService,
    Rnx2RtkpTimeRange,
)

router = APIRouter()

# Store for active rnx2rtkp jobs
_active_jobs: dict[str, asyncio.Task] = {}


class Rnx2RtkpExecuteRequest(BaseModel):
    """Request to execute rnx2rtkp post-processing."""

    input_files: Rnx2RtkpInputFiles
    config: Rnx2RtkpConfig
    time_range: Rnx2RtkpTimeRange | None = None
    job_id: str | None = Field(
        default=None,
        description="Optional custom job ID",
    )


class Rnx2RtkpJobResponse(BaseModel):
    """Response for rnx2rtkp job execution."""

    job_id: str
    status: str  # "started", "completed", "failed"
    return_code: int | None = None
    error_message: str | None = None
    output_file: str | None = None


async def _run_rnx2rtkp_job(job_id: str, job: Rnx2RtkpJob) -> Rnx2RtkpJobResponse:
    """Execute rnx2rtkp job with WebSocket log streaming.

    Args:
        job_id: Unique job identifier
        job: Job specification

    Returns:
        Job response with status and results
    """
    service = Rnx2RtkpService()

    # Create log callback that broadcasts to WebSocket
    async def log_callback(message: str) -> None:
        await ws_manager.broadcast_log(job_id, message)

    try:
        # Broadcast job start status
        await ws_manager.broadcast_status(
            job_id,
            "running",
            {
                "command": "rnx2rtkp",
                "output_file": job.input_files.output_file,
            },
        )

        # Run rnx2rtkp
        result = await service.run_rnx2rtkp(job, log_callback=log_callback)

        # Broadcast completion status
        await ws_manager.broadcast_status(
            job_id,
            "completed" if result.returncode == 0 else "failed",
            {
                "return_code": result.returncode,
                "output_file": job.input_files.output_file,
            },
        )

        return Rnx2RtkpJobResponse(
            job_id=job_id,
            status="completed" if result.returncode == 0 else "failed",
            return_code=result.returncode,
            output_file=job.input_files.output_file if result.returncode == 0 else None,
            error_message=None if result.returncode == 0 else "Processing failed (see logs)",
        )

    except FileNotFoundError as e:
        error_msg = f"Input file not found: {e}"
        await ws_manager.broadcast_log(job_id, f"[ERROR] {error_msg}")
        await ws_manager.broadcast_status(job_id, "failed", {"error": error_msg})
        return Rnx2RtkpJobResponse(
            job_id=job_id,
            status="failed",
            error_message=error_msg,
        )

    except Exception as e:
        error_msg = f"Unexpected error: {e}"
        await ws_manager.broadcast_log(job_id, f"[ERROR] {error_msg}")
        await ws_manager.broadcast_status(job_id, "failed", {"error": error_msg})
        return Rnx2RtkpJobResponse(
            job_id=job_id,
            status="failed",
            error_message=error_msg,
        )

    finally:
        # Clean up job from active jobs
        if job_id in _active_jobs:
            del _active_jobs[job_id]


@router.post("/execute", response_model=Rnx2RtkpJobResponse)
async def execute_rnx2rtkp(request: Rnx2RtkpExecuteRequest) -> Rnx2RtkpJobResponse:
    """Execute rnx2rtkp post-processing.

    This endpoint starts the rnx2rtkp process asynchronously and streams
    logs via WebSocket. The job runs in the background and the response
    is returned immediately with the job ID.

    Args:
        request: Job configuration

    Returns:
        Job response with job_id and status

    Raises:
        HTTPException: If validation fails or job cannot be started
    """
    # Generate job ID
    job_id = request.job_id or f"rnx2rtkp-{uuid.uuid4().hex[:8]}"

    # Validate input files exist (relative to /workspace)
    workspace = Path("/workspace")
    rover_path = workspace / request.input_files.rover_obs_file.lstrip("/")
    nav_path = workspace / request.input_files.nav_file.lstrip("/")

    if not rover_path.exists():
        raise HTTPException(
            status_code=400,
            detail=f"Rover observation file not found: {request.input_files.rover_obs_file}",
        )

    if not nav_path.exists():
        raise HTTPException(
            status_code=400,
            detail=f"Navigation file not found: {request.input_files.nav_file}",
        )

    # Validate base obs file if provided
    if request.input_files.base_obs_file:
        base_path = workspace / request.input_files.base_obs_file.lstrip("/")
        if not base_path.exists():
            raise HTTPException(
                status_code=400,
                detail=f"Base observation file not found: {request.input_files.base_obs_file}",
            )

    # Ensure output file path is absolute and within workspace
    output_file = request.input_files.output_file
    if not output_file.startswith("/workspace/"):
        output_file = f"/workspace/{output_file.lstrip('/')}"

    # Create job
    job = Rnx2RtkpJob(
        input_files=Rnx2RtkpInputFiles(
            rover_obs_file=str(rover_path),
            base_obs_file=str(workspace / request.input_files.base_obs_file.lstrip("/"))
            if request.input_files.base_obs_file
            else None,
            nav_file=str(nav_path),
            output_file=output_file,
        ),
        config=request.config,
        time_range=request.time_range,
    )

    # Start job in background
    task = asyncio.create_task(_run_rnx2rtkp_job(job_id, job))
    _active_jobs[job_id] = task

    return Rnx2RtkpJobResponse(
        job_id=job_id,
        status="started",
    )


@router.get("/status/{job_id}", response_model=Rnx2RtkpJobResponse)
async def get_job_status(job_id: str) -> Rnx2RtkpJobResponse:
    """Get status of a rnx2rtkp job.

    Args:
        job_id: Job identifier

    Returns:
        Job status response

    Raises:
        HTTPException: If job not found
    """
    if job_id not in _active_jobs:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}",
        )

    task = _active_jobs[job_id]

    if task.done():
        try:
            result = task.result()
            return result
        except Exception as e:
            return Rnx2RtkpJobResponse(
                job_id=job_id,
                status="failed",
                error_message=str(e),
            )
    else:
        return Rnx2RtkpJobResponse(
            job_id=job_id,
            status="running",
        )


@router.get("/jobs", response_model=list[str])
async def list_jobs() -> list[str]:
    """List all active rnx2rtkp job IDs.

    Returns:
        List of active job IDs
    """
    return list(_active_jobs.keys())
