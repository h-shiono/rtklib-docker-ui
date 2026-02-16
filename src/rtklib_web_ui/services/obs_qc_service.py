"""Observation data QC service — direct RINEX 3.x parser (no cssrlib dependency).

Parses RINEX 3.x/4.x observation files directly as fixed-width text,
extracting only satellite IDs, SNR values, and epoch timestamps for QC.
Supports .obs, .rnx, and gzip-compressed (.gz, .z) files.
"""

from __future__ import annotations

import gzip
import logging
from dataclasses import dataclass, field
from io import TextIOWrapper
from pathlib import Path
from typing import IO

from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ──────────────────────────── Response Models ────────────────────────────


class ObsHeaderInfo(BaseModel):
    rinex_version: str = ""
    receiver: str = ""
    antenna: str = ""
    approx_position: list[float] = []
    interval: float = 0.0
    start_time: str = ""
    end_time: str = ""
    num_epochs: int = 0
    num_satellites: int = 0


class SatVisSegment(BaseModel):
    sat_id: str
    constellation: str
    start: float  # Unix timestamp
    end: float


class ObsQcResponse(BaseModel):
    header: ObsHeaderInfo
    visibility: list[SatVisSegment]
    snr: list[list[float]]  # [[time, sat_idx, snr, el?, az?], ...]
    satellites: list[str]  # Index→ID mapping
    signals: list[str]  # Available SNR signals
    decimation_factor: int
    has_elevation: bool


# ──────────────────────────── Internal Helpers ────────────────────────────

_CONSTELLATION_ORDER = {"G": 0, "R": 1, "E": 2, "C": 3, "J": 4, "S": 5, "I": 6}


def _constellation_sort_key(sat_id: str) -> tuple[int, int]:
    prefix = sat_id[0]
    try:
        prn = int(sat_id[1:])
    except ValueError:
        prn = 999
    return (_CONSTELLATION_ORDER.get(prefix, 99), prn)


def _ymdhms_to_unix(y: int, m: int, d: int, h: int, mi: int, s: float) -> float:
    """Convert UTC date/time to Unix timestamp."""
    int_sec = int(s)
    frac = s - int_sec
    import datetime
    dt = datetime.datetime(y, m, d, h, mi, int_sec, tzinfo=datetime.timezone.utc)
    return dt.timestamp() + frac


def _unix_to_datetime_str(ts: float) -> str:
    import datetime
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def _open_rinex(path: Path) -> IO[str]:
    """Open a RINEX file, handling gzip compression."""
    name = path.name.lower()
    if name.endswith(".gz") or name.endswith(".z"):
        return TextIOWrapper(gzip.open(path, "rb"), encoding="ascii", errors="replace")
    return open(path, "r", encoding="ascii", errors="replace")


@dataclass
class _VisTracker:
    sat_id: str
    constellation: str
    segments: list[tuple[float, float]] = field(default_factory=list)
    _last_time: float = 0.0

    def update(self, t: float, gap_threshold: float) -> None:
        if self._last_time == 0.0:
            self.segments.append((t, t))
        elif t - self._last_time > gap_threshold:
            self.segments.append((t, t))
        else:
            start, _ = self.segments[-1]
            self.segments[-1] = (start, t)
        self._last_time = t


# ──────────────────────────── Header Parser ────────────────────────────


@dataclass
class _RinexHeader:
    version: str = ""
    receiver: str = ""
    antenna: str = ""
    approx_pos: list[float] = field(default_factory=list)
    # Per-constellation observation type list: {"G": ["C1C","L1C","S1C",...], ...}
    obs_types: dict[str, list[str]] = field(default_factory=dict)
    # Indices of SNR (S-type) observations per constellation: {"G": [2, 5], ...}
    snr_indices: dict[str, list[int]] = field(default_factory=dict)
    # All SNR signal names discovered
    snr_signals: list[str] = field(default_factory=list)


def _parse_header(fh: IO[str]) -> _RinexHeader:
    """Parse RINEX 3.x header, extracting only what we need for QC."""
    hdr = _RinexHeader()
    current_sys = ""
    pending_obs_types: list[str] = []
    expected_count = 0

    for line in fh:
        label = line[60:80].strip() if len(line) > 60 else ""

        if label == "END OF HEADER":
            break

        if label == "RINEX VERSION / TYPE":
            hdr.version = line[0:9].strip()

        elif label == "REC # / TYPE / VERS":
            hdr.receiver = line[20:40].strip()

        elif label == "ANT # / TYPE":
            hdr.antenna = line[20:40].strip()

        elif label == "APPROX POSITION XYZ":
            try:
                hdr.approx_pos = [
                    float(line[0:14]),
                    float(line[14:28]),
                    float(line[28:42]),
                ]
            except ValueError:
                pass

        elif label == "SYS / # / OBS TYPES":
            sys_char = line[0].strip()
            if sys_char:
                # New constellation block
                current_sys = sys_char
                try:
                    expected_count = int(line[3:6])
                except ValueError:
                    expected_count = 0
                pending_obs_types = line[7:58].split()
            else:
                # Continuation line
                pending_obs_types.extend(line[7:58].split())

            if len(pending_obs_types) >= expected_count and current_sys:
                obs_list = pending_obs_types[:expected_count]
                hdr.obs_types[current_sys] = obs_list
                # Find SNR indices
                snr_idx = []
                for i, ot in enumerate(obs_list):
                    if ot.startswith("S"):
                        snr_idx.append(i)
                        sig_name = f"{current_sys}{ot}"
                        if sig_name not in hdr.snr_signals:
                            hdr.snr_signals.append(sig_name)
                hdr.snr_indices[current_sys] = snr_idx
                current_sys = ""
                pending_obs_types = []

    if not hdr.snr_signals:
        hdr.snr_signals = ["S1C"]

    return hdr


# ──────────────────────────── Observation Parser ────────────────────────────


def _parse_obs_value(line: str, obs_index: int) -> float:
    """Extract a single observation value from a RINEX 3.x satellite line.

    Each observation occupies 16 characters: 14-char value + 1 LLI + 1 signal strength.
    First 3 characters are satellite ID (e.g. G01).
    """
    start = 3 + obs_index * 16
    end = start + 14
    if end > len(line):
        return 0.0
    field = line[start:end]
    if not field or field.isspace():
        return 0.0
    try:
        return float(field)
    except ValueError:
        return 0.0


# ──────────────────────────── Main Service ────────────────────────────


def analyze_obs(
    obs_file: str,
    nav_file: str | None = None,
    signal: str | None = None,
    decimation: int = 0,
) -> ObsQcResponse:
    """Analyze a RINEX observation file for QC.

    Single-pass direct text parser — no cssrlib dependency.
    """
    obs_path = Path(obs_file)
    if not obs_path.exists():
        raise FileNotFoundError(f"OBS file not found: {obs_file}")

    # ── Parse header ──
    with _open_rinex(obs_path) as fh:
        hdr = _parse_header(fh)

        # ── Stream through observations ──
        sat_id_set: set[str] = set()
        vis_trackers: dict[str, _VisTracker] = {}
        snr_raw: list[tuple[float, str, float]] = []

        epoch_count = 0
        first_time = 0.0
        last_time = 0.0
        prev_time = 0.0
        interval_sum = 0.0

        snr_decimation = max(decimation, 1)

        for line in fh:
            # Epoch header line starts with '>'
            if not line.startswith(">"):
                continue

            # Parse epoch: > YYYY MM DD HH MM SS.SSSSSSS  flag  num_sats
            try:
                year = int(line[2:6])
                month = int(line[7:9])
                day = int(line[10:12])
                hour = int(line[13:15])
                minute = int(line[16:18])
                sec = float(line[19:29])
                epoch_flag = int(line[29:32])
                num_sats = int(line[32:35])
            except (ValueError, IndexError):
                continue

            # Skip non-observation epochs (flag > 1 = special events)
            if epoch_flag > 1:
                # Read and discard the lines for this event
                for _ in range(num_sats):
                    next(fh, None)
                continue

            t = _ymdhms_to_unix(year, month, day, hour, minute, sec)
            epoch_count += 1
            if epoch_count == 1:
                first_time = t
            if epoch_count > 1 and prev_time > 0:
                interval_sum += t - prev_time
            prev_time = t
            last_time = t

            collect_snr = (epoch_count % snr_decimation == 0)

            # Read satellite lines
            for _ in range(num_sats):
                sat_line = next(fh, None)
                if sat_line is None:
                    break

                # Satellite ID: first 3 chars (e.g. "G01", "E05", "C23")
                if len(sat_line) < 3:
                    continue
                sat_id = sat_line[0:3].strip()
                if len(sat_id) < 2:
                    continue
                sys_char = sat_id[0]

                # Normalize sat_id: ensure 3 chars (e.g. "G1" → "G01")
                if len(sat_id) == 2:
                    sat_id = sys_char + "0" + sat_id[1]

                sat_id_set.add(sat_id)

                # Visibility tracking
                if sat_id not in vis_trackers:
                    vis_trackers[sat_id] = _VisTracker(
                        sat_id=sat_id, constellation=sys_char
                    )
                vis_trackers[sat_id].update(t, 120.0)

                # SNR extraction (decimated)
                if collect_snr and sys_char in hdr.snr_indices:
                    indices = hdr.snr_indices[sys_char]
                    if indices:
                        # Use first available SNR signal
                        snr_val = _parse_obs_value(sat_line, indices[0])
                        if snr_val > 0:
                            snr_raw.append((t, sat_id, snr_val))

            # Adaptive decimation: after 200 epochs, estimate file size
            if epoch_count == 200 and decimation == 0:
                avg_sats = max(len(sat_id_set) * 0.7, 1)
                avg_int = interval_sum / max(epoch_count - 1, 1)
                if avg_int > 0 and first_time < last_time:
                    duration = last_time - first_time
                    est_total = duration / avg_int
                    # Extrapolate total duration from 200-epoch sample
                    # Assume data covers ~24h if duration_so_far is small
                    if est_total < epoch_count * 2:
                        est_total = epoch_count * 50
                else:
                    est_total = epoch_count * 50
                max_snr_points = 30000
                needed = max_snr_points / avg_sats
                snr_decimation = max(1, int(est_total / needed))

    if epoch_count == 0:
        raise ValueError("No observation epochs found in file")

    # ── Build header info ──
    avg_interval = interval_sum / max(epoch_count - 1, 1)
    header = ObsHeaderInfo(
        rinex_version=hdr.version,
        receiver=hdr.receiver,
        antenna=hdr.antenna,
        approx_position=hdr.approx_pos,
        interval=round(avg_interval, 3),
        start_time=_unix_to_datetime_str(first_time),
        end_time=_unix_to_datetime_str(last_time),
        num_epochs=epoch_count,
        num_satellites=len(sat_id_set),
    )

    # ── Build satellite index ──
    sorted_sats = sorted(sat_id_set, key=_constellation_sort_key)
    sat_index_map = {sid: idx for idx, sid in enumerate(sorted_sats)}

    # ── Build visibility segments ──
    # Refine gap threshold with actual interval
    gap_threshold = max(avg_interval * 2.5, 60.0)
    visibility: list[SatVisSegment] = []
    for sid in sorted_sats:
        tracker = vis_trackers.get(sid)
        if tracker:
            for seg_start, seg_end in tracker.segments:
                visibility.append(
                    SatVisSegment(
                        sat_id=sid,
                        constellation=sid[0],
                        start=seg_start,
                        end=seg_end,
                    )
                )

    # ── Convert SNR to indexed format ──
    snr_data: list[list[float]] = []
    for t, sid, snr_val in snr_raw:
        idx = sat_index_map.get(sid)
        if idx is not None:
            snr_data.append([t, idx, snr_val, -1.0, -1.0])

    return ObsQcResponse(
        header=header,
        visibility=visibility,
        snr=snr_data,
        satellites=sorted_sats,
        signals=hdr.snr_signals,
        decimation_factor=snr_decimation,
        has_elevation=False,
    )
