/**
 * API client for rnx2rtkp endpoints
 */

import type { Rnx2RtkpConfig, Rnx2RtkpInputFiles, Rnx2RtkpTimeRange } from '../types/rnx2rtkpConfig';

const API_BASE = '/api/rnx2rtkp';

export interface Rnx2RtkpJobResponse {
  job_id: string;
  status: 'started' | 'running' | 'completed' | 'failed';
  return_code?: number;
  error_message?: string;
  output_file?: string;
}

export interface Rnx2RtkpExecuteRequest {
  input_files: Rnx2RtkpInputFiles;
  config: Rnx2RtkpConfig;
  time_range?: Rnx2RtkpTimeRange;
  job_id?: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    // FastAPI validation errors return detail as an array of objects
    let message = 'API request failed';
    if (typeof error.detail === 'string') {
      message = error.detail;
    } else if (Array.isArray(error.detail)) {
      message = error.detail
        .map((e: { msg?: string; loc?: string[] }) =>
          e.loc ? `${e.loc.join('.')}: ${e.msg}` : e.msg || String(e)
        )
        .join('; ');
    }
    throw new Error(message);
  }
  return response.json();
}

/**
 * Execute rnx2rtkp post-processing
 */
export async function executeRnx2Rtkp(request: Rnx2RtkpExecuteRequest): Promise<Rnx2RtkpJobResponse> {
  const response = await fetch(`${API_BASE}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return handleResponse<Rnx2RtkpJobResponse>(response);
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<Rnx2RtkpJobResponse> {
  const response = await fetch(`${API_BASE}/status/${jobId}`);
  return handleResponse<Rnx2RtkpJobResponse>(response);
}

/**
 * List all active jobs
 */
export async function listJobs(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/jobs`);
  return handleResponse<string[]>(response);
}
