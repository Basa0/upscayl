import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UpscaylStateService {
  readonly batchMode = signal(false);
  readonly progress = signal('');
  readonly imagePath = signal('');
  readonly upscaledImagePath = signal('');
  readonly batchFolderPath = signal('');
  readonly upscaledBatchFolderPath = signal('');
  readonly dimensions = signal<{ width: number | null; height: number | null }>({
    width: null,
    height: null,
  });
  readonly doubleUpscaylCounter = signal(0);
  readonly customModelIds = signal<string[]>([]);
  readonly logs = signal<string[]>([]);
  readonly appVersion = signal('');

  resetImagePaths(): void {
    this.imagePath.set('');
    this.upscaledImagePath.set('');
    this.batchFolderPath.set('');
    this.upscaledBatchFolderPath.set('');
    this.progress.set('');
    this.dimensions.set({ width: null, height: null });
  }

  appendLog(line: string): void {
    this.logs.update((prev) => [...prev.slice(-500), line]);
  }
}
