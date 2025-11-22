import { join } from 'path';
import { readFile } from 'fs/promises';
import { fetchFileFromR2, getR2Key } from './r2';

export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }
  
  const projectRoot = process.cwd();
  const possiblePaths = [
    join(projectRoot, 'Data'),
    join(projectRoot, '..', 'Data'),
    join(projectRoot, 'data'),
  ];
  
  return possiblePaths[0];
}

export const indicatorMapping: Record<string, string> = {
  'SBOT': 'SBT',
};

/**
 * Read a file from either R2 (if R2_ACCESS_KEY_ID is set) or local filesystem
 * If R2 is configured, it will NOT fall back to local filesystem on error
 */
export async function readDataFile(filePath: string): Promise<string> {
  // Try R2 first if credentials are configured (check for non-empty string)
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_ACCESS_KEY_ID.trim() !== '') {
    try {
      const r2Key = getR2Key(filePath);
      console.log(`Attempting to fetch from R2: ${r2Key} (original path: ${filePath})`);
      return await fetchFileFromR2(r2Key);
    } catch (error: any) {
      // If R2 is configured, don't fall back to local filesystem - re-throw the error
      console.error(`R2 fetch failed for ${filePath}:`, {
        r2Key: getR2Key(filePath),
        errorName: error.name,
        errorMessage: error.message,
        httpStatusCode: error.$metadata?.httpStatusCode,
        errorCode: error.code,
      });
      throw error; // Re-throw instead of falling back
    }
  }
  
  // Fall back to local filesystem only if R2 is NOT configured
  const dataDir = getDataDir();
  const fullPath = filePath.startsWith(dataDir) ? filePath : join(dataDir, filePath);
  console.log(`Reading from local filesystem: ${fullPath}`);
  return await readFile(fullPath, 'utf-8');
}

