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


class BaselineLengthConstraint(BaseModel):
    """Baseline length constraint configuration."""

    enabled: bool = Field(default=False)
    length: float = Field(default=0.0)
    sigma: float = Field(default=0.0)


class Setting2Config(BaseModel):
    """Setting 2: Ambiguity resolution parameters."""

    # Section A: Ambiguity Resolution Strategy
    gps_ar_mode: str = Field(default="continuous")
    glo_ar_mode: str = Field(default="on")
    bds_ar_mode: str = Field(default="on")
    min_ratio_to_fix: float = Field(default=3.0)

    # Section B: Thresholds & Validation
    min_confidence: float = Field(default=0.9999)
    max_fcb: float = Field(default=0.25)
    min_lock_to_fix: int = Field(default=0)
    min_elevation_to_fix: float = Field(default=0.0)
    min_fix_to_hold: int = Field(default=10)
    min_elevation_to_hold: float = Field(default=0.0)
    outage_to_reset: int = Field(default=5)
    slip_threshold: float = Field(default=0.05)
    max_age_diff: float = Field(default=30.0)
    sync_solution: bool = Field(default=False)
    reject_threshold_gdop: float = Field(default=30.0)
    reject_threshold_innovation: float = Field(default=30.0)

    # Section C: Advanced Filter
    num_filter_iterations: int = Field(default=1)
    baseline_length_constraint: BaselineLengthConstraint = Field(default_factory=BaselineLengthConstraint)


class OutputConfig(BaseModel):
    """Output format configuration."""

    # Group A: Format Configuration
    solution_format: str = Field(default="llh")
    output_header: bool = Field(default=True)
    output_processing_options: bool = Field(default=False)
    time_format: str = Field(default="gpst")
    num_decimals: int = Field(default=3)
    lat_lon_format: str = Field(default="ddd.ddddddd")
    field_separator: str = Field(default="")
    output_velocity: bool = Field(default=False)

    # Group B: Datum & Geoid
    datum: str = Field(default="wgs84")
    height: str = Field(default="ellipsoidal")
    geoid_model: str = Field(default="internal")

    # Group C: Output Control
    static_solution_mode: str = Field(default="all")
    nmea_interval_rmc_gga: int = Field(default=0)
    nmea_interval_gsa_gsv: int = Field(default=0)
    output_solution_status: str = Field(default="off")
    debug_trace: str = Field(default="off")


class StatsConfig(BaseModel):
    """Error models and process noises configuration."""

    # Group A: Measurement Errors (1-sigma)
    code_phase_ratio_l1: float = Field(default=100.0)
    code_phase_ratio_l2: float = Field(default=100.0)
    phase_error_a: float = Field(default=0.003)
    phase_error_b: float = Field(default=0.003)
    phase_error_baseline: float = Field(default=0.0)
    doppler_frequency: float = Field(default=1.0)

    # Group B: Process Noises (1-sigma/sqrt(s))
    receiver_accel_horiz: float = Field(default=1.0)
    receiver_accel_vert: float = Field(default=0.1)
    carrier_phase_bias: float = Field(default=0.0001)
    ionospheric_delay: float = Field(default=0.001)
    tropospheric_delay: float = Field(default=0.0001)
    satellite_clock_stability: float = Field(default=5e-12)


class StationPosition(BaseModel):
    """Station position configuration."""

    mode: str = Field(default="llh")  # llh, xyz, rtcm, rinex, average
    values: list[float] = Field(default=[0.0, 0.0, 0.0])
    antenna_type_enabled: bool = Field(default=False)
    antenna_type: str = Field(default="")
    antenna_delta: list[float] = Field(default=[0.0, 0.0, 0.0])  # E, N, U in meters


class PositionsConfig(BaseModel):
    """Rover and base station positions configuration."""

    rover: StationPosition = Field(default_factory=StationPosition)
    base: StationPosition = Field(default_factory=StationPosition)
    station_position_file: str = Field(default="")


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
    stats: StatsConfig = Field(default_factory=StatsConfig)
    positions: PositionsConfig = Field(default_factory=PositionsConfig)
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
