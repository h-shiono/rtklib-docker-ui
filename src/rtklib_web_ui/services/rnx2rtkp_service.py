"""
rnx2rtkp service for post-processing GNSS data.
"""

import asyncio
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ConstellationSelection(BaseModel):
    """Satellite constellation selection."""

    gps: bool = Field(default=True)
    glonass: bool = Field(default=True)
    galileo: bool = Field(default=True)
    qzss: bool = Field(default=True)
    sbas: bool = Field(default=True)
    beidou: bool = Field(default=True)
    irnss: bool = Field(default=False)


class SnrMaskConfig(BaseModel):
    """SNR mask configuration."""

    enable_rover: bool = Field(default=False)
    enable_base: bool = Field(default=False)
    # Matrix: [Frequency_Index][Elevation_Bin_Index]
    # Frequencies: L1=0, L2=1, L5=2
    # Elevation bins: <5, 15, 25, 35, 45, 55, 65, 75, >85 (9 bins)
    mask: list[list[float]] = Field(
        default=[
            [0.0] * 9,  # L1
            [0.0] * 9,  # L2
            [0.0] * 9,  # L5
        ]
    )


class Setting1Config(BaseModel):
    """Setting 1: Basic positioning parameters."""

    # Group A: Basic Strategy
    positioning_mode: str = Field(default="kinematic")
    frequency: str = Field(default="l1+l2")
    filter_type: str = Field(default="forward")

    # Group B: Masks & Environment
    elevation_mask: float = Field(default=15.0)
    snr_mask: SnrMaskConfig = Field(default_factory=SnrMaskConfig)
    ionosphere_correction: str = Field(default="broadcast")
    troposphere_correction: str = Field(default="saastamoinen")
    ephemeris_option: str = Field(default="broadcast")

    # Group C: Satellite Selection
    constellations: ConstellationSelection = Field(default_factory=ConstellationSelection)
    excluded_satellites: str = Field(default="")

    # Group D: Advanced Options
    earth_tides_correction: str = Field(default="off")
    receiver_dynamics: str = Field(default="off")
    satellite_pcv: bool = Field(default=False)
    receiver_pcv: bool = Field(default=False)
    phase_windup: bool = Field(default=False)
    reject_eclipse: bool = Field(default=False)
    raim_fde: bool = Field(default=False)


class Setting2Config(BaseModel):
    """Setting 2: Ambiguity resolution parameters."""

    ar_mode: str = Field(default="continuous")
    min_ratio_to_fix: float = Field(default=3.0)
    min_fix_samples: int = Field(default=10)
    min_hold_samples: int = Field(default=40)


class OutputConfig(BaseModel):
    """Output format configuration."""

    solution_format: str = Field(default="llh")
    output_header: bool = Field(default=True)
    output_velocity: bool = Field(default=False)


class BasePositionConfig(BaseModel):
    """Base station position configuration."""

    latitude: float = Field(default=0.0)
    longitude: float = Field(default=0.0)
    height: float = Field(default=0.0)
    use_rinex_header: bool = Field(default=True)


class FilesConfig(BaseModel):
    """Auxiliary files configuration."""

    antex_file: Optional[str] = None
    geoid_file: Optional[str] = None
    dcb_file: Optional[str] = None
    eop_file: Optional[str] = None


class MiscConfig(BaseModel):
    """Miscellaneous configuration."""

    time_system: str = Field(default="gpst")
    ionosphere_correction: bool = Field(default=True)
    troposphere_correction: bool = Field(default=True)


class Rnx2RtkpConfig(BaseModel):
    """Complete rnx2rtkp configuration."""

    setting1: Setting1Config = Field(default_factory=Setting1Config)
    setting2: Setting2Config = Field(default_factory=Setting2Config)
    output: OutputConfig = Field(default_factory=OutputConfig)
    base_position: BasePositionConfig = Field(default_factory=BasePositionConfig)
    files: FilesConfig = Field(default_factory=FilesConfig)
    misc: MiscConfig = Field(default_factory=MiscConfig)


class Rnx2RtkpInputFiles(BaseModel):
    """Input files for rnx2rtkp."""

    rover_obs_file: str
    nav_file: str
    base_obs_file: Optional[str] = None
    output_file: str


class Rnx2RtkpTimeRange(BaseModel):
    """Time range for processing."""

    start_time: Optional[str] = None
    end_time: Optional[str] = None
    interval: Optional[int] = None


class Rnx2RtkpJob(BaseModel):
    """Complete rnx2rtkp job specification."""

    input_files: Rnx2RtkpInputFiles
    config: Rnx2RtkpConfig
    time_range: Optional[Rnx2RtkpTimeRange] = None


class Rnx2RtkpService:
    """Service for running rnx2rtkp post-processing."""

    def __init__(self, rtklib_bin_path: str = "/usr/local/bin/rnx2rtkp"):
        """Initialize the service.

        Args:
            rtklib_bin_path: Path to the rnx2rtkp binary
        """
        self.rtklib_bin_path = rtklib_bin_path

    def generate_conf_file(self, config: Rnx2RtkpConfig) -> str:
        """Generate RTKLIB .conf file content from configuration.

        Args:
            config: Configuration object

        Returns:
            Configuration file content as string
        """
        lines = []

        # Positioning mode mapping
        pos_mode_map = {
            "single": "0",
            "dgps": "1",
            "kinematic": "2",
            "static": "3",
            "moving-base": "4",
            "fixed": "5",
            "ppp-kinematic": "6",
            "ppp-static": "7",
        }

        # Frequency mapping
        freq_map = {
            "l1": "1",
            "l1+l2": "2",
            "l1+l2+l5": "3",
            "l1+l2+l5+l6": "4",
            "l1+l2+l5+l6+l7": "5",
        }

        # AR mode mapping
        ar_mode_map = {
            "off": "0",
            "continuous": "1",
            "instantaneous": "2",
            "fix-and-hold": "3",
        }

        # Solution format mapping
        sol_format_map = {
            "llh": "0",
            "xyz": "1",
            "enu": "2",
            "nmea": "3",
        }

        # Setting 1
        lines.append(f"pos1-posmode={pos_mode_map.get(config.setting1.positioning_mode, '2')}")
        lines.append(f"pos1-frequency={freq_map.get(config.setting1.frequency, '2')}")
        lines.append(f"pos1-elmask={config.setting1.elevation_mask}")
        lines.append(f"pos1-snrmask_r={config.setting1.snr_mask}")

        # Setting 2
        lines.append(f"pos2-armode={ar_mode_map.get(config.setting2.ar_mode, '1')}")
        lines.append(f"pos2-arthres={config.setting2.min_ratio_to_fix}")
        lines.append(f"pos2-arminfix={config.setting2.min_fix_samples}")
        lines.append(f"pos2-arminhold={config.setting2.min_hold_samples}")

        # Output
        lines.append(f"out-solformat={sol_format_map.get(config.output.solution_format, '0')}")
        lines.append(f"out-outhead={'on' if config.output.output_header else 'off'}")
        lines.append(f"out-outvel={'on' if config.output.output_velocity else 'off'}")

        # Base position
        if not config.base_position.use_rinex_header:
            lines.append(f"ant2-postype=0")  # LLH
            lines.append(f"ant2-pos1={config.base_position.latitude}")
            lines.append(f"ant2-pos2={config.base_position.longitude}")
            lines.append(f"ant2-pos3={config.base_position.height}")
        else:
            lines.append("ant2-postype=3")  # RINEX header

        # Misc
        lines.append(f"misc-timeinterp={'on' if config.misc.ionosphere_correction else 'off'}")
        lines.append(f"misc-iono-corr={'on' if config.misc.ionosphere_correction else 'off'}")
        lines.append(f"misc-tropo-corr={'on' if config.misc.troposphere_correction else 'off'}")

        return "\n".join(lines)

    async def run_rnx2rtkp(
        self,
        job: Rnx2RtkpJob,
        log_callback: Optional[callable] = None,
    ) -> subprocess.CompletedProcess:
        """Run rnx2rtkp with the given job configuration.

        Args:
            job: Job specification
            log_callback: Optional callback for log messages

        Returns:
            CompletedProcess object

        Raises:
            FileNotFoundError: If input files don't exist
            subprocess.CalledProcessError: If rnx2rtkp fails
        """
        # Generate config file
        conf_content = self.generate_conf_file(job.config)

        # Create temporary config file
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".conf", delete=False
        ) as conf_file:
            conf_file.write(conf_content)
            conf_path = conf_file.name

        try:
            # Build command
            cmd = [
                self.rtklib_bin_path,
                "-k",
                conf_path,
                "-o",
                job.input_files.output_file,
                job.input_files.rover_obs_file,
            ]

            # Add base observation file if provided
            if job.input_files.base_obs_file:
                cmd.append(job.input_files.base_obs_file)

            # Add navigation file
            cmd.append(job.input_files.nav_file)

            if log_callback:
                await log_callback(f"[CMD] {' '.join(cmd)}")
                await log_callback(f"[INFO] Configuration file: {conf_path}")

            # Run rnx2rtkp
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            # Stream output
            async def read_stream(stream, callback):
                while True:
                    line = await stream.readline()
                    if not line:
                        break
                    if callback:
                        await callback(line.decode().strip())

            if log_callback:
                await asyncio.gather(
                    read_stream(process.stdout, log_callback),
                    read_stream(process.stderr, log_callback),
                )

            await process.wait()

            if log_callback:
                await log_callback(f"[INFO] Process finished with code {process.returncode}")

            return subprocess.CompletedProcess(
                args=cmd,
                returncode=process.returncode,
                stdout=b"",
                stderr=b"",
            )

        finally:
            # Clean up temp config file
            try:
                Path(conf_path).unlink()
            except Exception as e:
                logger.warning(f"Failed to delete temp config file: {e}")
