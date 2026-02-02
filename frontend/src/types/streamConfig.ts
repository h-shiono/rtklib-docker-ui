/**
 * Stream configuration types for str2str
 */

export type StreamType = 'serial' | 'tcpcli' | 'tcpsvr' | 'ntripcli' | 'file';

export interface SerialParams {
  port: string;
  baudrate: number;
  bytesize?: 8 | 7;
  parity?: 'N' | 'E' | 'O';
  stopbits?: 1 | 2;
}

export interface TcpClientParams {
  host: string;
  port: number;
}

export interface TcpServerParams {
  port: number;
}

export interface NtripClientParams {
  host: string;
  port: number;
  mountpoint: string;
  username?: string;
  password?: string;
}

export interface FileParams {
  path: string;
}

export type StreamParams =
  | SerialParams
  | TcpClientParams
  | TcpServerParams
  | NtripClientParams
  | FileParams;

export interface StreamConfig {
  id: string;
  type: StreamType;
  params: StreamParams;
}

export interface InputStream extends StreamConfig {
  // Input stream specific fields if any
}

export interface OutputStream extends StreamConfig {
  // Output stream specific fields if any
}

export interface BuilderConfig {
  input: InputStream;
  outputs: OutputStream[];
}

export interface ProfileConfig {
  name?: string;
  description?: string;
  builder: BuilderConfig;
  raw: string;
  mode: 'builder' | 'raw';
}

/**
 * RTKLIB file naming convention keywords
 */
export interface FileNamingKeyword {
  keyword: string;
  description: string;
  example: string;
}

export const FILE_NAMING_KEYWORDS: FileNamingKeyword[] = [
  { keyword: '%Y', description: 'Year (4 digits)', example: '2026' },
  { keyword: '%y', description: 'Year (2 digits)', example: '26' },
  { keyword: '%m', description: 'Month', example: '01-12' },
  { keyword: '%d', description: 'Day of month', example: '01-31' },
  { keyword: '%h', description: 'Hour', example: '00-23' },
  { keyword: '%M', description: 'Minute', example: '00-59' },
  { keyword: '%S', description: 'Second', example: '00-59' },
  { keyword: '%n', description: 'Day of year', example: '001-366' },
  { keyword: '%W', description: 'GPS week', example: '0001-9999' },
  { keyword: '%D', description: 'Day of GPS week', example: '0-6' },
  { keyword: '%H', description: 'Hour of GPS week', example: '00-167' },
  { keyword: '%ha', description: 'Hour in alphabet', example: 'a-x' },
  { keyword: '%r', description: 'Receiver ID', example: 'station name' },
  { keyword: '%b', description: 'Base station ID', example: 'base name' },
];
