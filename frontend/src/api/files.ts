/**
 * API client for file browser endpoints
 */

const API_BASE = '/api/files';

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number | null;
}

export interface DirectoryListing {
  path: string;
  items: FileInfo[];
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'API request failed');
  }
  return response.json();
}

/**
 * Browse directory contents in /workspace
 */
export async function browseDirectory(path: string = '/'): Promise<DirectoryListing> {
  const response = await fetch(`${API_BASE}/browse?path=${encodeURIComponent(path)}`);
  return handleResponse<DirectoryListing>(response);
}
