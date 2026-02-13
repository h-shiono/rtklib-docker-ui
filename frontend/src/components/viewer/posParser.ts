import type { PosEpoch } from './types';

/**
 * Parse RTKLIB .pos file content into PosEpoch array.
 *
 * Expected format (space-separated, header lines start with '%'):
 *   %  GPST          latitude(deg)  longitude(deg)  height(m)  Q  ns  sdn  sde  sdu  sdne  sdeu  sdun  age  ratio
 *   2024/01/15 00:00:00.000   35.12345678  139.12345678   45.1234   1  12  0.0012  0.0010  0.0025  0.0001  -0.0003  0.0002  0.00  999.9
 */
export function parsePosFile(content: string): PosEpoch[] {
  const lines = content.split('\n');
  const epochs: PosEpoch[] = [];

  for (const line of lines) {
    // Skip header lines and empty lines
    if (line.startsWith('%') || line.trim() === '') continue;

    const parts = line.trim().split(/\s+/);
    // Need at least: date, time, lat, lon, height, Q, ns, sdn, sde, sdu, sdne, sdeu, sdun, age
    if (parts.length < 14) continue;

    // GPST date and time: "YYYY/MM/DD" "HH:MM:SS.sss"
    const dateStr = parts[0];
    const timeStr = parts[1];

    // Parse to Date: convert "2024/01/15" to "2024-01-15"
    const time = new Date(`${dateStr.replace(/\//g, '-')}T${timeStr}Z`);
    if (isNaN(time.getTime())) continue;

    const lat = parseFloat(parts[2]);
    const lon = parseFloat(parts[3]);
    const height = parseFloat(parts[4]);

    // Skip rows with NaN coordinates
    if (isNaN(lat) || isNaN(lon) || isNaN(height)) continue;

    epochs.push({
      time,
      timeUnix: time.getTime() / 1000,
      lat,
      lon,
      height,
      Q: parseInt(parts[5], 10),
      ns: parseInt(parts[6], 10),
      sdn: parseFloat(parts[7]),
      sde: parseFloat(parts[8]),
      sdu: parseFloat(parts[9]),
      // parts[10-12] are sdne, sdeu, sdun — skipped
      age: parseFloat(parts[13]),
      ratio: parts.length > 14 ? parseFloat(parts[14]) : 0,
    });
  }

  return epochs;
}
