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

export type ARMode = 'off' | 'continuous' | 'instantaneous' | 'fix-and-hold';

export type SolutionFormat = 'llh' | 'xyz' | 'enu' | 'nmea';

export interface Setting1Config {
  positioningMode: PositioningMode;
  frequency: Frequency;
  elevationMask: number; // degrees
  snrMask: number; // dB-Hz
}

export interface Setting2Config {
  arMode: ARMode;
  minRatioToFix: number;
  minFixSamples: number;
  minHoldSamples: number;
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
  positioningMode: 'kinematic',
  frequency: 'l1+l2',
  elevationMask: 15,
  snrMask: 35,
};

export const DEFAULT_SETTING2: Setting2Config = {
  arMode: 'continuous',
  minRatioToFix: 3.0,
  minFixSamples: 10,
  minHoldSamples: 40,
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
