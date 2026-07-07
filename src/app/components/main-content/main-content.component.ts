import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { open } from '@tauri-apps/plugin-dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UiButtonComponent } from '../../ui/button.component';
import { ComparisonSliderComponent } from './comparison-slider.component';
import { LensViewComponent } from './lens-view.component';
import { SettingsService } from '../../services/settings.service';
import { UpscaylStateService } from '../../services/upscayl-state.service';
import { TauriService } from '../../services/tauri.service';
import { ToastService } from '../../services/toast.service';
import { IMAGE_FORMATS } from '@common/image-formats';
import getDirectoryFromPath from '@common/get-directory-from-path';
import type { ImageFormat } from '@common/image-formats';

@Component({
  selector: 'app-main-content',
  standalone: true,
  imports: [
    TranslatePipe,
    UiButtonComponent,
    ComparisonSliderComponent,
    LensViewComponent,
  ],
  template: `
    <main class="main-pane">
      @if (tauri.platform() === 'mac') {
        <div data-tauri-drag-region></div>
      }

      @if (state.progress() && !state.upscaledImagePath() && !state.upscaledBatchFolderPath()) {
        <div class="progress">
          <div class="bar" [style.width.%]="progressPercent()"></div>
          <span>{{ state.progress() }}</span>
          <ui-button size="sm" variant="ghost" (click)="stop()">Stop</ui-button>
        </div>
      }

      <div class="viewer-area">
        @if (showInstructions()) {
          <div class="instructions">
            <h2>{{ 'HEADER.DESCRIPTION' | t }}</h2>
            <p>Drag and drop an image here, or use the sidebar to select a file.</p>
          </div>
        }

        @if (!state.batchMode() && state.imagePath() && !state.upscaledImagePath()) {
          <img class="preview" [src]="asset(state.imagePath())" alt="Selected" (load)="onImageLoad($event)" />
        }

        @if (state.batchMode() && state.batchFolderPath() && !state.upscaledBatchFolderPath()) {
          <p class="batch-info">{{ 'APP.PROGRESS.BATCH.SELECTED_FOLDER_TITLE' | t }} {{ state.batchFolderPath() }}</p>
        }

        @if (state.batchMode() && state.upscaledBatchFolderPath()) {
          <div class="done">
            <p>{{ 'APP.PROGRESS.BATCH.DONE_TITLE' | t }}</p>
            <ui-button (click)="openFolder()">
              {{ 'APP.PROGRESS.BATCH.OPEN_UPSCAYLED_FOLDER_TITLE' | t }}
            </ui-button>
          </div>
        }

        @if (
          !state.batchMode() &&
          settings.viewType() === 'slider' &&
          state.imagePath() &&
          state.upscaledImagePath()
        ) {
          <app-comparison-slider
            class="comparison"
            [beforeSrc]="asset(state.imagePath())"
            [afterSrc]="asset(state.upscaledImagePath())"
          />
        }

        @if (
          !state.batchMode() &&
          settings.viewType() === 'lens' &&
          state.imagePath() &&
          state.upscaledImagePath()
        ) {
          <app-lens-view
            class="comparison"
            [beforeSrc]="asset(state.imagePath())"
            [afterSrc]="asset(state.upscaledImagePath())"
            [size]="settings.lensSize()"
          />
        }
      </div>

      @if (!state.batchMode() && (state.imagePath() || state.upscaledImagePath())) {
        <div class="view-toggle">
          <ui-button
            size="sm"
            [variant]="settings.viewType() === 'slider' ? 'primary' : 'ghost'"
            (click)="settings.viewType.set('slider')"
          >
            Slider
          </ui-button>
          <ui-button
            size="sm"
            [variant]="settings.viewType() === 'lens' ? 'primary' : 'ghost'"
            (click)="settings.viewType.set('lens')"
          >
            Lens
          </ui-button>
        </div>
      }
    </main>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1;
      min-width: 0;
      height: 100%;
    }

    .progress {
      position: absolute;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%);
      width: min(480px, 90vw);
      background: var(--color-base-200);
      border-radius: var(--radius-btn);
      padding: 0.75rem;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .bar {
      height: 6px;
      background: var(--color-primary);
      border-radius: 999px;
      transition: width 0.2s;
    }
    .instructions {
      text-align: center;
      max-width: 32rem;
      padding: 2rem;
    }
    .preview {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .comparison {
      flex: 1;
      min-height: 0;
      align-self: stretch;
    }
    .batch-info {
      max-width: 48rem;
      text-align: center;
      word-break: break-all;
      padding: 0 1rem;
    }
    .done {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .view-toggle {
      flex-shrink: 0;
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--color-base-300);
      background: var(--color-base-100);
    }
  `,
})
export class MainContentComponent implements OnInit, OnDestroy {
  readonly settings = inject(SettingsService);
  readonly state = inject(UpscaylStateService);
  readonly tauri = inject(TauriService);
  private readonly toast = inject(ToastService);
  private unlistenDrag?: () => void;

  ngOnInit(): void {
    void this.setupDragDrop();
  }

  ngOnDestroy(): void {
    this.unlistenDrag?.();
  }

  asset(path: string): string {
    return this.tauri.assetUrl(path);
  }

  showInstructions(): boolean {
    if (this.state.batchMode()) {
      return !this.state.batchFolderPath() && !this.state.upscaledBatchFolderPath();
    }
    return !this.state.imagePath() && !this.state.upscaledImagePath();
  }

  progressPercent(): number {
    const p = parseFloat(this.state.progress());
    return Number.isFinite(p) ? Math.min(100, p) : 0;
  }

  onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.state.dimensions.set({ width: img.naturalWidth, height: img.naturalHeight });
  }

  async stop(): Promise<void> {
    await this.tauri.invoke('stop_upscayl');
    this.state.progress.set('');
  }

  async openFolder(): Promise<void> {
    await this.tauri.invoke('open_folder', { path: this.state.upscaledBatchFolderPath() });
  }

  private async setupDragDrop(): Promise<void> {
    if (!this.tauri.isTauri) return;
    try {
      const webview = getCurrentWebview();
      this.unlistenDrag = await webview.onDragDropEvent((event) => {
        if (event.payload.type === 'drop' && event.payload.paths?.length) {
          this.handleDroppedPath(event.payload.paths[0]);
        }
      });
    } catch {
      // drag-drop optional in browser dev
    }
  }

  private handleDroppedPath(path: string): void {
    this.state.resetImagePaths();
    const ext = path.split('.').pop()?.toLowerCase() as ImageFormat | undefined;
    if (!ext || !IMAGE_FORMATS.includes(ext)) {
      this.toast.show('Invalid image file.');
      return;
    }
    this.state.imagePath.set(path);
    if (!this.settings.rememberOutputFolder()) {
      this.settings.savedOutputPath.set(getDirectoryFromPath(path));
    }
  }

  async selectImage(): Promise<void> {
    const path = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: [...IMAGE_FORMATS] }],
    });
    if (typeof path === 'string') this.handleDroppedPath(path);
  }
}
