/**
 * Tauri/Browser compatibility layer.
 * All Tauri-dependent code must use these wrappers.
 * When running in a browser (no __TAURI__), fallbacks activate automatically.
 */

export const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

export async function readFile(path: string): Promise<string> {
  if (isTauri()) {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    return readTextFile(path);
  }
  console.warn('[TauriCompat] readFile called in browser mode, path:', path);
  return `[Browser mode: file ${path} would be read here]`;
}

export async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri()) {
    const { invoke: tauriInvoke } = await import('@tauri-apps/api/core');
    return tauriInvoke<T>(command, args);
  }
  console.warn('[TauriCompat] invoke called in browser mode:', command, args);
  return handleBrowserInvoke<T>(command, args);
}

async function handleBrowserInvoke<T>(command: string, _args?: Record<string, unknown>): Promise<T> {
  switch (command) {
    case 'list_permissions':
      return [] as unknown as T;
    case 'grant_folder_permission':
    case 'grant_folder_access':
      return true as unknown as T;
    case 'revoke_folder_permission':
    case 'revoke_folder_access':
      return true as unknown as T;
    case 'start_voice_session':
      return { status: 'browser_mode_no_voice' } as unknown as T;
    case 'stop_voice_session':
      return { status: 'stopped' } as unknown as T;
    default:
      throw new Error(`Unknown command in browser mode: ${command}`);
  }
}

export async function openDirectoryDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const result = await open({ directory: true, multiple: false });
    return typeof result === 'string' ? result : null;
  }
  return window.prompt('Enter folder path (browser mode):');
}

export async function openFileDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const result = await open({ multiple: false, title: 'Attach File' });
    return typeof result === 'string' ? result : null;
  }
  return null;
}

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().minimize();
  }
}

export async function maximizeWindow(): Promise<void> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().toggleMaximize();
  }
}

export async function closeWindow(): Promise<void> {
  if (isTauri()) {
    const { getCurrentWindow } = await import('@tauri-apps/api/window');
    await getCurrentWindow().close();
  }
}

/**
 * Browser-safe localStorage wrapper for persisting store data.
 * Replaces @tauri-apps/plugin-store usage.
 */
export const localStore = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(`ta_${key}`);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(`ta_${key}`, JSON.stringify(value));
    } catch {
      // localStorage may be full or blocked
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(`ta_${key}`);
    } catch {
      // Ignore
    }
  },
};
