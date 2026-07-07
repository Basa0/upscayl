import { Component, computed, inject } from '@angular/core';
import { open } from '@tauri-apps/plugin-dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UiButtonComponent } from '../../ui/button.component';
import { UiToggleComponent } from '../../ui/toggle.component';
import { ModelSelectComponent } from './model-select.component';
import { SettingsService } from '../../services/settings.service';
import { UpscaylStateService } from '../../services/upscayl-state.service';
import { TauriService } from '../../services/tauri.service';
import { ToastService } from '../../services/toast.service';
import { IMAGE_FORMATS } from '@common/image-formats';
import getDirectoryFromPath from '@common/get-directory-from-path';
import type {
  BatchUpscaylPayload,
  DoubleUpscaylPayload,
  ImageUpscaylPayload,
} from '@common/types/types';

@Component({
  selector: 'app-upscayl-tab',
  standalone: true,
  imports: [TranslatePipe, UiButtonComponent, UiToggleComponent, ModelSelectComponent],
  template: `
    <div class="panel-scroll">
      <div class="row">
        <ui-toggle
          [checked]="state.batchMode()"
          (checkedChange)="state.batchMode.set($event)"
        />
        <span>{{ 'APP.BATCH_MODE.TITLE' | t }}</span>
      </div>

      <section>
        <p class="step-heading">{{ 'APP.FILE_SELECTION.TITLE' | t }}</p>
        <ui-button (click)="pickInput()">
          {{
            state.batchMode()
              ? ('APP.FILE_SELECTION.BATCH_MODE_TYPE' | t)
              : ('APP.FILE_SELECTION.SINGLE_MODE_TYPE' | t)
          }}
        </ui-button>
      </section>

      <section>
        <app-model-select />
        @if (!state.batchMode()) {
          <label class="row">
            <input
              type="checkbox"
              [checked]="settings.doubleUpscayl()"
              (change)="settings.doubleUpscayl.set($any($event.target).checked)"
            />
            {{ 'APP.DOUBLE_UPSCAYL.TITLE' | t }}
          </label>
        }
        <label class="field">
          <span class="step-heading">{{ 'SETTINGS.IMAGE_SCALE.TITLE' | t }}</span>
          <select [value]="settings.scale()" (change)="onScale($event)">
            <option value="2">2x</option>
            <option value="3">3x</option>
            <option value="4">4x</option>
            <option value="8">8x</option>
            <option value="16">16x</option>
          </select>
        </label>
      </section>

      <section>
        <p class="step-heading">{{ 'APP.OUTPUT_PATH_SELECTION.TITLE' | t }}</p>
        <ui-button variant="ghost" (click)="pickOutput()">
          {{ 'APP.OUTPUT_PATH_SELECTION.BUTTON_TITLE' | t }}
        </ui-button>
        @if (settings.savedOutputPath()) {
          <p class="path">{{ settings.savedOutputPath() }}</p>
        }
      </section>

      <section>
        <p class="step-heading">{{ 'APP.SCALE_SELECTION.TITLE' | t }}</p>
        @if (resolution()) {
          <p class="hint">
            {{ 'APP.SCALE_SELECTION.FROM_TITLE' | t }}
            <strong>{{ state.dimensions().width }}x{{ state.dimensions().height }}</strong>
            {{ 'APP.SCALE_SELECTION.TO_TITLE' | t }}
            <strong>{{ resolution()!.width }}x{{ resolution()!.height }}</strong>
          </p>
        }
        <ui-button variant="secondary" [disabled]="!canStart()" (click)="startUpscayl()">
          {{
            state.progress()
              ? ('APP.SCALE_SELECTION.IN_PROGRESS_BUTTON_TITLE' | t)
              : ('APP.SCALE_SELECTION.START_BUTTON_TITLE' | t)
          }}
        </ui-button>
      </section>
    </div>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-top: 0.75rem;
    }
    select {
      padding: 0.5rem;
      border-radius: var(--radius-btn);
      border: 1px solid var(--color-base-300);
      background: var(--color-base-200);
      color: inherit;
    }
    .path {
      font-size: 0.75rem;
      word-break: break-all;
      opacity: 0.8;
    }
    .hint {
      font-size: 0.85rem;
    }
  `,
})
export class UpscaylTabComponent {
  readonly settings = inject(SettingsService);
  readonly state = inject(UpscaylStateService);
  private readonly tauri = inject(TauriService);
  private readonly toast = inject(ToastService);

  readonly resolution = computed(() => {
    const { width, height } = this.state.dimensions();
    if (!width || !height) return null;
    const scale = parseInt(this.settings.scale(), 10);
    const factor = this.settings.doubleUpscayl() ? scale * scale : scale;
    if (this.settings.useCustomWidth() && this.settings.customWidth() > 0) {
      const w = this.settings.customWidth();
      return { width: w, height: Math.round(w * (height / width)) };
    }
    return { width: width * factor, height: height * factor };
  });

  async pickInput(): Promise<void> {
    this.state.resetImagePaths();
    if (this.state.batchMode()) {
      const path = await open({ directory: true, multiple: false });
      if (typeof path === 'string') {
        this.state.batchFolderPath.set(path);
        if (!this.settings.rememberOutputFolder()) {
          this.settings.savedOutputPath.set(path);
        }
      }
      return;
    }
    const path = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: [...IMAGE_FORMATS] }],
    });
    if (typeof path === 'string') {
      this.state.imagePath.set(path);
      if (!this.settings.rememberOutputFolder()) {
        this.settings.savedOutputPath.set(getDirectoryFromPath(path));
      }
    }
  }

  async pickOutput(): Promise<void> {
    const path = await open({ directory: true, multiple: false });
    this.settings.savedOutputPath.set(typeof path === 'string' ? path : null);
  }

  canStart(): boolean {
    if (this.state.progress()) return false;
    if (!this.settings.savedOutputPath()) return false;
    if (this.state.batchMode()) return this.state.batchFolderPath().length > 0;
    return this.state.imagePath().length > 0;
  }

  async startUpscayl(): Promise<void> {
    this.state.upscaledImagePath.set('');
    this.state.upscaledBatchFolderPath.set('');
    if (!this.canStart()) {
      this.toast.show('Select an image or folder and output path first.');
      return;
    }
    this.state.progress.set('Please wait...');

    const base = {
      model: this.settings.selectedModelId(),
      gpuId: this.settings.gpuId() || null,
      saveImageAs: this.settings.saveImageAs(),
      scale: this.settings.scale(),
      compression: String(this.settings.compression()),
      noImageProcessing: this.settings.noImageProcessing(),
      customWidth:
        this.settings.useCustomWidth() && this.settings.customWidth() > 0
          ? String(this.settings.customWidth())
          : null,
      useCustomWidth: this.settings.useCustomWidth(),
      tileSize: this.settings.tileSize(),
      ttaMode: this.settings.ttaMode(),
      copyMetadata: this.settings.copyMetadata(),
    };

    try {
      if (this.settings.doubleUpscayl() && !this.state.batchMode()) {
        const payload: DoubleUpscaylPayload = {
          ...base,
          imagePath: this.state.imagePath(),
          outputPath: this.settings.savedOutputPath()!,
        };
        await this.tauri.invoke('upscayl_double', { payload });
      } else if (this.state.batchMode()) {
        const payload: BatchUpscaylPayload = {
          ...base,
          batchFolderPath: this.state.batchFolderPath(),
          outputPath: this.settings.savedOutputPath()!,
        };
        await this.tauri.invoke('upscayl_batch', { payload });
      } else {
        const payload: ImageUpscaylPayload = {
          ...base,
          imagePath: this.state.imagePath(),
          outputPath: this.settings.savedOutputPath()!,
          overwrite: this.settings.overwrite(),
        };
        await this.tauri.invoke('upscayl_image', { payload });
      }
    } catch (e) {
      this.toast.show(String(e));
      this.state.progress.set('');
    }
  }

  onScale(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.settings.scale.set(value);
  }
}
