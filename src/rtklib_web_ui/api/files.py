"""File browser API for /workspace directory."""

from pathlib import Path
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

WORKSPACE_ROOT = Path("/workspace")


class FileInfo(BaseModel):
    """File or directory information."""

    name: str
    path: str
    type: Literal["file", "directory"]
    size: int | None = None


class DirectoryListing(BaseModel):
    """Directory listing response."""

    path: str
    items: list[FileInfo]


@router.get("/browse", response_model=DirectoryListing)
async def browse_directory(path: str = "/") -> DirectoryListing:
    """Browse files and directories in the workspace."""
    # Resolve path relative to workspace root
    target_path = (WORKSPACE_ROOT / path.lstrip("/")).resolve()

    # Security check: ensure path is within workspace
    if not str(target_path).startswith(str(WORKSPACE_ROOT)):
        raise HTTPException(status_code=403, detail="Access denied")

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Path not found")

    if not target_path.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory")

    items: list[FileInfo] = []
    for item in sorted(target_path.iterdir(), key=lambda x: (x.is_file(), x.name)):
        item_type: Literal["file", "directory"] = "directory" if item.is_dir() else "file"
        relative_path = str(item.relative_to(WORKSPACE_ROOT))
        items.append(
            FileInfo(
                name=item.name,
                path=f"/{relative_path}",
                type=item_type,
                size=item.stat().st_size if item.is_file() else None,
            )
        )

    return DirectoryListing(
        path=f"/{str(target_path.relative_to(WORKSPACE_ROOT))}",
        items=items,
    )
