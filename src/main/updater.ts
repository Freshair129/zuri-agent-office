import { ipcMain } from 'electron';
import type { WebContents } from 'electron';
import type { UpdateStatus } from '../shared/updateState';

export type { UpdateStatus };
export const MANUAL_UPDATE_MESSAGE =
  'Manual updates only — no Zuri release channel is configured. Install a verified Zuri build manually.';

/** Compatibility with the app's quit-cancellation path. No update is staged. */
export function abortPendingRestart(): void {}

/** Retained pure asset selection helper for release tooling; no network access. */
export function pickDownloadAsset(
  assets: ReadonlyArray<{ name?: string; browser_download_url?: string }> | undefined,
  platform: NodeJS.Platform = process.platform,
  arch: string = process.arch
): string | null {
  if (!Array.isArray(assets)) return null;
  const want = platform === 'darwin' ? new RegExp(`-mac-${arch}\\.dmg$`)
    : platform === 'win32' ? /-win-x64-setup\.exe$/
    : platform === 'linux' ? /-linux-x86_64\.AppImage$/
    : null;
  if (!want) return null;
  const hit = assets.find((a) => typeof a.name === 'string' && want.test(a.name) && typeof a.browser_download_url === 'string');
  return hit?.browser_download_url ?? null;
}

/** No feed, background checks, downloads, browser navigation, or simulated updates.
 * Keep the IPC surface so existing windows receive a truthful terminal response. */
export function initAutoUpdater(getWebContents: () => WebContents | null): void {
  const status: UpdateStatus = { state: 'manual-only', message: MANUAL_UPDATE_MESSAGE };
  const unavailable = (): { ok: false; error: string } => ({ ok: false, error: MANUAL_UPDATE_MESSAGE });
  ipcMain.handle('update:current', () => status);
  ipcMain.handle('update:checkNow', () => {
    try { getWebContents()?.send('update:status', status); } catch { /* window closed */ }
    return unavailable();
  });
  ipcMain.handle('update:download', unavailable);
  ipcMain.handle('update:restartAndInstall', unavailable);
  ipcMain.handle('update:openRelease', unavailable);
  ipcMain.handle('update:simulate', unavailable);
}
