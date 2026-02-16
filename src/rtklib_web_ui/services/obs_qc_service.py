"""Observation data QC service using cssrlib for RINEX parsing."""

from __future__ import annotations

import logging
import math
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
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

# Constellation sort order and prefix
_CONSTELLATION_ORDER = {"G": 0, "R": 1, "E": 2, "C": 3, "J": 4, "S": 5, "I": 6}


def _constellation_sort_key(sat_id: str) -> tuple[int, int]:
    """Sort key: (constellation_order, PRN)."""
    prefix = sat_id[0]
    try:
        prn = int(sat_id[1:])
    except ValueError:
        prn = 999
    return (_CONSTELLATION_ORDER.get(prefix, 99), prn)


def _gtime_to_unix(t) -> float:
    """Convert cssrlib gtime_t to Unix timestamp (seconds since 1970-01-01)."""
    return float(t.time) + t.sec


def _unix_to_datetime_str(ts: float) -> str:
    """Convert Unix timestamp to ISO-like string."""
    import datetime
    dt = datetime.datetime.fromtimestamp(ts, tz=datetime.timezone.utc)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


# Signal auto-selection priority per constellation
_SIGNAL_PRIORITY: dict[str, list[str]] = {
    "G": ["S1C", "S1W", "S1X"],
    "E": ["S1C", "S1X"],
    "R": ["S1C", "S1P"],
    "C": ["S2I", "S2X", "S1X"],
    "J": ["S1C", "S1X"],
    "S": ["S1C"],
    "I": ["S1C"],
}


@dataclass
class _VisTracker:
    """Track per-satellite visibility segments."""

    sat_id: str
    constellation: str
    segments: list[tuple[float, float]] = field(default_factory=list)
    _last_time: float = 0.0

    def update(self, t: float, gap_threshold: float) -> None:
        if self._last_time == 0.0:
            # First appearance
            self.segments.append((t, t))
        elif t - self._last_time > gap_threshold:
            # Gap detected → new segment
            self.segments.append((t, t))
        else:
            # Extend current segment
            start, _ = self.segments[-1]
            self.segments[-1] = (start, t)
        self._last_time = t


# ──────────────────────────── Main Service ────────────────────────────


def _auto_configure_signals(dec) -> None:
    """Configure sig_tab from sig_map so decode_obs() includes all constellations.

    After decode_obsh(), sig_map contains all signals found in the RINEX header,
    but sig_tab (desired signals) is empty. Without configuring sig_tab,
    decode_obs() skips all satellites.

    This function builds sig_tab from sig_map, registering all available signals.
    """
    from cssrlib.gnss import rSigRnx

    if not dec.sig_map:
        return

    sig_list = []
    seen = set()  # Track (sys, typ, sig) to avoid duplicates

    for sys, signals in dec.sig_map.items():
        for _idx, rnx_sig in signals.items():
            key = (rnx_sig.sys, rnx_sig.typ, rnx_sig.sig)
            if key not in seen:
                seen.add(key)
                sig_list.append(rnx_sig)

    if sig_list:
        dec.setSignals(sig_list)
        dec.autoSubstituteSignals()


def analyze_obs(
    obs_file: str,
    nav_file: str | None = None,
    signal: str | None = None,
    decimation: int = 0,
) -> ObsQcResponse:
    """Analyze a RINEX observation file for QC.

    Args:
        obs_file: Path to RINEX OBS file.
        nav_file: Optional path to NAV file (for Az/El computation).
        signal: Signal filter e.g. "S1C". None = auto-select.
        decimation: Decimation factor. 0 = auto-compute.

    Returns:
        ObsQcResponse with header, visibility, SNR data.
    """
    from cssrlib.rinex import rnxdec
    from cssrlib.gnss import Nav, sat2id, sat2prn, uGNSS, ecef2pos, geodist, satazel

    obs_path = Path(obs_file)
    if not obs_path.exists():
        raise FileNotFoundError(f"OBS file not found: {obs_file}")

    # ── Step 1: Parse OBS header ──
    dec = rnxdec()
    ret = dec.decode_obsh(str(obs_path))
    if ret != 0:
        raise ValueError(f"Failed to decode RINEX header (code={ret}). Only RINEX 3.x/4.x supported.")

    # Configure signals from header so decode_obs() includes all constellations.
    # Without setSignals(), sig_tab is empty and all satellites are skipped.
    _auto_configure_signals(dec)

    header = ObsHeaderInfo(
        rinex_version=str(getattr(dec, "ver", "")),
    )

    # Try to extract receiver/antenna info
    if hasattr(dec, "rcv"):
        header.receiver = str(getattr(dec, "rcv", ""))
    if hasattr(dec, "ant"):
        header.antenna = str(getattr(dec, "ant", ""))

    # Approx position from header
    pos_ecef = getattr(dec, "pos", None)
    if pos_ecef is not None and hasattr(pos_ecef, '__len__') and len(pos_ecef) >= 3:
        header.approx_position = [float(pos_ecef[0]), float(pos_ecef[1]), float(pos_ecef[2])]

    # ── Step 2: Parse NAV file if provided ──
    nav = None
    has_elevation = False
    receiver_pos = None  # geodetic [lat, lon, h] in radians/meters

    if nav_file:
        nav_path = Path(nav_file)
        if nav_path.exists():
            try:
                nav = Nav()
                dec.decode_nav(str(nav_path), nav)
                has_elevation = True
            except Exception as e:
                logger.warning("Failed to decode NAV file: %s", e)
                nav = None
                has_elevation = False

    # Compute receiver geodetic position for Az/El
    if has_elevation and header.approx_position and len(header.approx_position) == 3:
        rr = np.array(header.approx_position)
        if np.linalg.norm(rr) > 1e6:  # Sanity check
            receiver_pos = ecef2pos(rr)
        else:
            has_elevation = False

    # ── Step 3: First pass — count epochs, discover satellites ──
    all_sat_ids: set[str] = set()
    epoch_count = 0
    first_time = 0.0
    last_time = 0.0
    interval_sum = 0.0
    prev_time = 0.0

    obs = dec.decode_obs()
    while obs.t.time > 0:
        t = _gtime_to_unix(obs.t)
        epoch_count += 1
        if epoch_count == 1:
            first_time = t
        if epoch_count > 1 and prev_time > 0:
            interval_sum += t - prev_time
        prev_time = t
        last_time = t

        for sat in obs.sat:
            if sat > 0:
                sid = sat2id(sat)
                all_sat_ids.add(sid)

        obs = dec.decode_obs()

    if epoch_count == 0:
        raise ValueError("No observation epochs found in file")

    # Compute average interval
    avg_interval = interval_sum / max(epoch_count - 1, 1)
    header.interval = round(avg_interval, 3)
    header.start_time = _unix_to_datetime_str(first_time)
    header.end_time = _unix_to_datetime_str(last_time)
    header.num_epochs = epoch_count
    header.num_satellites = len(all_sat_ids)

    # Sort satellites by constellation then PRN
    sorted_sats = sorted(all_sat_ids, key=_constellation_sort_key)
    sat_index_map = {sid: idx for idx, sid in enumerate(sorted_sats)}

    # Auto-compute decimation
    avg_sats = max(len(all_sat_ids) * 0.7, 1)
    max_snr_points = 50000
    if decimation == 0:
        needed_epochs = max_snr_points / avg_sats
        decimation = max(1, int(epoch_count / needed_epochs))

    # Determine available SNR signals from obs.sig
    available_signals: list[str] = []
    # We'll discover signals during second pass

    # Gap threshold for visibility: 2x interval or 60s minimum
    gap_threshold = max(avg_interval * 2.5, 60.0)

    # ── Step 4: Second pass — visibility + SNR + Az/El ──
    # Re-open file
    dec2 = rnxdec()
    dec2.decode_obsh(str(obs_path))
    _auto_configure_signals(dec2)
    if nav and nav_file:
        dec2.decode_nav(str(Path(nav_file)), nav)

    vis_trackers: dict[str, _VisTracker] = {}
    snr_data: list[list[float]] = []  # [[time, sat_idx, snr, el, az], ...]
    epoch_idx = 0
    _signals_discovered = False

    obs = dec2.decode_obs()
    while obs.t.time > 0:
        t = _gtime_to_unix(obs.t)
        is_decimated = (epoch_idx % decimation == 0)

        # Compute satellite positions if we have NAV and this is a decimated epoch
        sat_positions = None
        if has_elevation and nav and is_decimated:
            try:
                from cssrlib.ephemeris import satposs
                rs, _vs, _dts, svh, _nsat = satposs(obs, nav)
                sat_positions = rs
            except Exception:
                sat_positions = None

        for i, sat in enumerate(obs.sat):
            if sat <= 0:
                continue

            sid = sat2id(sat)
            if sid not in sat_index_map:
                continue

            # ── Visibility tracking (every epoch) ──
            if sid not in vis_trackers:
                constellation = sid[0]
                vis_trackers[sid] = _VisTracker(sat_id=sid, constellation=constellation)
            vis_trackers[sid].update(t, gap_threshold)

            # ── SNR extraction (decimated epochs only) ──
            if is_decimated:
                # Get SNR value — use first available signal column
                snr_val = 0.0
                if hasattr(obs, 'S') and obs.S is not None and i < obs.S.shape[0]:
                    # Try to find a non-zero SNR across signal columns
                    for col in range(obs.S.shape[1]):
                        v = obs.S[i, col]
                        if v > 0:
                            snr_val = float(v)
                            break

                if snr_val > 0:
                    sat_idx = sat_index_map[sid]
                    el_deg = -1.0
                    az_deg = -1.0

                    # Compute Az/El if satellite position available
                    if sat_positions is not None and receiver_pos is not None and i < sat_positions.shape[0]:
                        try:
                            rs_i = sat_positions[i, :]
                            if np.linalg.norm(rs_i) > 1e6:
                                rr = np.array(header.approx_position)
                                _, e = geodist(rs_i, rr)
                                az, el = satazel(receiver_pos, e)
                                el_deg = float(np.degrees(el))
                                az_deg = float(np.degrees(az))
                        except Exception:
                            pass

                    snr_data.append([t, sat_idx, snr_val, el_deg, az_deg])

        epoch_idx += 1
        obs = dec2.decode_obs()

    # Build visibility segments
    visibility: list[SatVisSegment] = []
    for sid in sorted_sats:
        tracker = vis_trackers.get(sid)
        if tracker:
            for start, end in tracker.segments:
                visibility.append(SatVisSegment(
                    sat_id=sid,
                    constellation=sid[0],
                    start=start,
                    end=end,
                ))

    # Discover available SNR signals from header
    available_signals = []
    from cssrlib.gnss import uTYP as _uTYP
    for sys, signals in dec.sig_map.items():
        for _idx, rnx_sig in signals.items():
            if rnx_sig.typ == _uTYP.S:
                sig_str = str(rnx_sig)
                if sig_str not in available_signals:
                    available_signals.append(sig_str)
    if not available_signals:
        available_signals = ["S1C"]

    header.rinex_version = str(getattr(dec, 'ver', ''))

    return ObsQcResponse(
        header=header,
        visibility=visibility,
        snr=snr_data,
        satellites=sorted_sats,
        signals=available_signals,
        decimation_factor=decimation,
        has_elevation=has_elevation,
    )
