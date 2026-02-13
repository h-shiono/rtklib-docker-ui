/** Single epoch from a RTKLIB .pos file */
export interface PosEpoch {
  /** GPST timestamp as Date object */
  time: Date;
  /** GPST timestamp as unix seconds (for uPlot X-axis) */
  timeUnix: number;
  /** Latitude in degrees */
  lat: number;
  /** Longitude in degrees */
  lon: number;
  /** Height in meters (ellipsoidal) */
  height: number;
  /** Quality flag: 1=fix, 2=float, 3=sbas, 4=dgps, 5=single, 6=ppp */
  Q: number;
  /** Number of satellites */
  ns: number;
  /** Standard deviation north (m) */
  sdn: number;
  /** Standard deviation east (m) */
  sde: number;
  /** Standard deviation up (m) */
  sdu: number;
  /** Age of differential (s) */
  age: number;
  /** AR ratio */
  ratio: number;
}

/** Color mapping for Q flags */
export const Q_COLORS: Record<number, string> = {
  1: '#40c057', // green - fix
  2: '#fab005', // yellow/orange - float
  3: '#228be6', // blue - sbas
  4: '#15aabf', // cyan - dgps
  5: '#fa5252', // red - single
  6: '#be4bdb', // purple - ppp
};

/** Labels for Q flags */
export const Q_LABELS: Record<number, string> = {
  1: 'Fix',
  2: 'Float',
  3: 'SBAS',
  4: 'DGPS',
  5: 'Single',
  6: 'PPP',
};

/** Which metric to plot on chart Y-axis */
export type ChartMetric = 'height' | 'sdn' | 'sde' | 'sdu';
