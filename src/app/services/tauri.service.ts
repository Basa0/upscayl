import { Injectable, signal, computed, effect } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { convertFileSrc } from '@tauri-apps/api/core';

@Injectable({ providedIn: 'root' })
export class TauriService {
  readonly isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    return invoke<T>(cmd, args);
  }

  listen<T>(event: string, handler: (payload: T) => void): Promise<UnlistenFn> {
    return listen<T>(event, (e) => handler(e.payload));
  }

  assetUrl(path: string): string {
    if (!path) return '';
    return convertFileSrc(path);
  }

  platform(): 'mac' | 'win' | 'linux' {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('mac')) return 'mac';
    if (ua.includes('win')) return 'win';
    return 'linux';
  }
}
