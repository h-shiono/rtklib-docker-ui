/**
 * rnx2rtkp configuration types
 */

export type PositioningMode =
  | 'single'
  | 'dgps'
  | 'kinematic'
  | 'static'
  | 'moving-base'
  | 'fixed'
  | 'ppp-kinematic'
  | 'ppp-static';

export type Frequency = 'l1' | 'l1+l2' | 'l1+l2+l5' | 'l1+l2+l5+l6' | 'l1+l2+l5+l6+l7';

export type FilterType = 'forward' | 'backward' | 'combined';

export type IonosphereCorrection = 'off' | 'broadcast' | 'sbas' | 'dual-freq' | 'est-stec' | 'ionex-tec';

export type TroposphereCorrection = 'off' | 'saastamoinen' | 'sbas' | 'est-ztd' | 'est-ztd-grad';

export type EphemerisOption = 'broadcast' | 'precise' | 'broadcast+sbas' | 'broadcast+ssrapc' | 'broadcast+ssrcom';

export type EarthTidesCorrection = 'off' | 'solid' | 'solid+otl' | 'solid+otl+pole';

export type ReceiverDynamics = 'off' | 'on';

export interface ConstellationSelection {
  gps: boolean;
  glonass: boolean;
  galileo: boolean;
  qzss: boolean;
  sbas: boolean;
  beidou: boolean;
  irnss: boolean;
}

export type ARMode = 'off' | 'continuous' | 'instantaneous' | 'fix-and-hold';

export type SolutionFormat = 'llh' | 'xyz' | 'enu' | 'nmea';

export interface SnrMaskConfig {
  enableRover: boolean;
  enableBase: boolean;
  // Matrix: [Frequency_Index][Elevation_Bin_Index]
  // Frequencies: L1=0, L2=1, L5=2
  // Elevation bins: <5, 15, 25, 35, 45, 55, 65, 75, >85 (9 bins)
  mask: number[][]; // 3x9 matrix
}

export interface Setting1Config {
  // Group A: Basic Strategy
  positioningMode: PositioningMode;
  frequency: Frequency;
  filterType: FilterType;

  // Group B: Masks & Environment
  elevationMask: number; // degrees
  snrMask: SnrMaskConfig;
  ionosphereCorrection: IonosphereCorrection;
  troposphereCorrection: TroposphereCorrection;
  ephemerisOption: EphemerisOption;

  // Group C: Satellite Selection
  constellations: ConstellationSelection;
  excludedSatellites: string;

  // Group D: Advanced Options
  earthTidesCorrection: EarthTidesCorrection;
  receiverDynamics: ReceiverDynamics;
  satellitePcv: boolean;
  receiverPcv: boolean;
  phaseWindup: boolean;
  rejectEclipse: boolean;
  raimFde: boolean;
}

export type GpsArMode = 'off' | 'continuous' | 'instantaneous' | 'fix-and-hold' | 'ppp-ar';
export type GloArMode = 'off' | 'on' | 'autocal';
export type BdsArMode = 'off' | 'on';

export interface BaselineLengthConstraint {
  enabled: boolean;
  length: number; // meters
  sigma: number; // meters
}

export interface Setting2Config {
  // Section A: Ambiguity Resolution Strategy
  gpsArMode: GpsArMode;
  gloArMode: GloArMode;
  bdsArMode: BdsArMode;
  minRatioToFix: number;

  // Section B: Thresholds & Validation
  minConfidence: number;
  maxFcb: number;
  minLockToFix: number;
  minElevationToFix: number; // degrees
  minFixToHold: number;
  minElevationToHold: number; // degrees
  outageToReset: number; // seconds
  slipThreshold: number; // meters
  maxAgeDiff: number; // seconds
  syncSolution: boolean;
  rejectThresholdGdop: number;
  rejectThresholdInnovation: number; // meters

  // Section C: Advanced Filter
  numFilterIterations: number;
  baselineLengthConstraint: BaselineLengthConstraint;
}

export interface OutputConfig {
  solutionFormat: SolutionFormat;
  outputHeader: boolean;
  outputVelocity: boolean;
}

export interface BasePositionConfig {
  latitude: number;
  longitude: number;
  height: number;
  useRinexHeader: boolean;
}

export interface FilesConfig {
  antexFile?: string;
  geoidFile?: string;
  dcbFile?: string;
  eopFile?: string;
}

export interface MiscConfig {
  timeSystem: 'gpst' | 'utc' | 'jst';
  ionosphereCorrection: boolean;
  troposphereCorrection: boolean;
}

export interface Rnx2RtkpConfig {
  setting1: Setting1Config;
  setting2: Setting2Config;
  output: OutputConfig;
  basePosition: BasePositionConfig;
  files: FilesConfig;
  misc: MiscConfig;
}

export interface Rnx2RtkpInputFiles {
  roverObsFile: string;
  baseObsFile?: string;
  navFile: string;
  outputFile: string;
}

export interface Rnx2RtkpTimeRange {
  startTime?: string; // ISO format or empty
  endTime?: string;
  interval?: number; // seconds
}

export interface Rnx2RtkpJob {
  inputFiles: Rnx2RtkpInputFiles;
  timeRange?: Rnx2RtkpTimeRange;
  config: Rnx2RtkpConfig;
}

// Default configurations
export const DEFAULT_SETTING1: Setting1Config = {
  // Group A: Basic Strategy
  positioningMode: 'kinematic',
  frequency: 'l1+l2',
  filterType: 'forward',

  // Group B: Masks & Environment
  elevationMask: 15,
  snrMask: {
    enableRover: false,
    enableBase: false,
    // Default mask values: 3 frequencies (L1, L2, L5) × 9 elevation bins
    mask: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0], // L1
      [0, 0, 0, 0, 0, 0, 0, 0, 0], // L2
      [0, 0, 0, 0, 0, 0, 0, 0, 0], // L5
    ],
  },
  ionosphereCorrection: 'broadcast',
  troposphereCorrection: 'saastamoinen',
  ephemerisOption: 'broadcast',

  // Group C: Satellite Selection
  constellations: {
    gps: true,
    glonass: true,
    galileo: true,
    qzss: true,
    sbas: true,
    beidou: true,
    irnss: false,
  },
  excludedSatellites: '',

  // Group D: Advanced Options
  earthTidesCorrection: 'off',
  receiverDynamics: 'off',
  satellitePcv: false,
  receiverPcv: false,
  phaseWindup: false,
  rejectEclipse: false,
  raimFde: false,
};

export const DEFAULT_SETTING2: Setting2Config = {
  // Section A: Ambiguity Resolution Strategy
  gpsArMode: 'continuous',
  gloArMode: 'on',
  bdsArMode: 'on',
  minRatioToFix: 3.0,

  // Section B: Thresholds & Validation
  minConfidence: 0.9999,
  maxFcb: 0.25,
  minLockToFix: 0,
  minElevationToFix: 0,
  minFixToHold: 10,
  minElevationToHold: 0,
  outageToReset: 5,
  slipThreshold: 0.05,
  maxAgeDiff: 30.0,
  syncSolution: false,
  rejectThresholdGdop: 30.0,
  rejectThresholdInnovation: 30.0,

  // Section C: Advanced Filter
  numFilterIterations: 1,
  baselineLengthConstraint: {
    enabled: false,
    length: 0.0,
    sigma: 0.0,
  },
};

export const DEFAULT_OUTPUT: OutputConfig = {
  solutionFormat: 'llh',
  outputHeader: true,
  outputVelocity: false,
};

export const DEFAULT_BASE_POSITION: BasePositionConfig = {
  latitude: 0,
  longitude: 0,
  height: 0,
  useRinexHeader: true,
};

export const DEFAULT_FILES: FilesConfig = {};

export const DEFAULT_MISC: MiscConfig = {
  timeSystem: 'gpst',
  ionosphereCorrection: true,
  troposphereCorrection: true,
};

export const DEFAULT_RNX2RTKP_CONFIG: Rnx2RtkpConfig = {
  setting1: DEFAULT_SETTING1,
  setting2: DEFAULT_SETTING2,
  output: DEFAULT_OUTPUT,
  basePosition: DEFAULT_BASE_POSITION,
  files: DEFAULT_FILES,
  misc: DEFAULT_MISC,
};
