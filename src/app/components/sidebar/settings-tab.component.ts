import { Component, inject } from '@angular/core';
import { open } from '@tauri-apps/plugin-dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UiButtonComponent } from '../../ui/button.component';
import { UiToggleComponent } from '../../ui/toggle.component';
import { SettingsService } from '../../services/settings.service';
import { UpscaylStateService } from '../../services/upscayl-state.service';
import { TauriService } from '../../services/tauri.service';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [TranslatePipe, UiButtonComponent, UiToggleComponent],
  template: `
    <div class="panel-scroll">
      <section>
        <p class="step-heading">{{ 'SETTINGS.SUPPORT.TITLE' | t }}</p>
        <ui-button variant="ghost">
          <a href="https://docs.upscayl.org/" target="_blank" rel="noreferrer">
            {{ 'SETTINGS.SUPPORT.DOCS_BUTTON_TITLE' | t }}
          </a>
        </ui-button>
      </section>

      <section>
        <p class="step-heading">{{ 'SETTINGS.LOG_AREA.BUTTON_TITLE' | t }}</p>
        <textarea readonly rows="6" [value]="state.logs().join('\n')"></textarea>
        <ui-button size="sm" variant="ghost" (click)="copyLogs()">
          {{ 'SETTINGS.LOG_AREA.BUTTON_TITLE' | t }}
        </ui-button>
      </section>

      <section>
        <label class="field">
          <span class="step-heading">Theme</span>
          <select [value]="settings.theme()" (change)="onTheme($event)">
            @for (theme of settings.availableThemes; track theme) {
              <option [value]="theme">{{ theme }}</option>
            }
          </select>
        </label>
      </section>

      <section>
        <p class="step-heading">{{ 'SETTINGS.IMAGE_FORMAT.TITLE' | t }}</p>
        <div class="row">
          @for (fmt of formats; track fmt) {
            <ui-button
              size="sm"
              [variant]="settings.saveImageAs() === fmt ? 'primary' : 'ghost'"
              (click)="settings.saveImageAs.set(fmt)"
            >
              {{ fmt.toUpperCase() }}
            </ui-button>
          }
        </div>
      </section>

      <div class="row">
        <ui-toggle
          [checked]="settings.copyMetadata()"
          (checkedChange)="settings.copyMetadata.set($event)"
        />
        <span>{{ 'SETTINGS.COPY_METADATA.TITLE' | t }}</span>
      </div>

      <div class="row">
        <ui-toggle
          [checked]="settings.rememberOutputFolder()"
          (checkedChange)="settings.rememberOutputFolder.set($event)"
        />
        <span>{{ 'SETTINGS.SAVE_OUTPUT_FOLDER.TITLE' | t }}</span>
      </div>

      <div class="row">
        <ui-toggle
          [checked]="settings.overwrite()"
          (checkedChange)="settings.overwrite.set($event)"
        />
        <span>{{ 'SETTINGS.OVERWRITE_TOGGLE.TITLE' | t }}</span>
      </div>

      <div class="row">
        <ui-toggle
          [checked]="settings.turnOffNotifications()"
          (checkedChange)="settings.turnOffNotifications.set($event)"
        />
        <span>{{ 'SETTINGS.TURN_OFF_NOTIFICATIONS.TITLE' | t }}</span>
      </div>

      <!-- TODO(updater): show auto-update toggle when tauri-plugin-updater is wired -->

      <label class="field">
        <span class="step-heading">{{ 'SETTINGS.GPU_ID_INPUT.TITLE' | t }}</span>
        <input
          type="text"
          [value]="settings.gpuId()"
          (input)="settings.gpuId.set($any($event.target).value)"
        />
      </label>

      <label class="field">
        <span class="step-heading">{{ 'SETTINGS.IMAGE_COMPRESSION.TITLE' | t }}</span>
        <input
          type="range"
          min="0"
          max="100"
          [value]="settings.compression()"
          (input)="settings.compression.set(+$any($event.target).value)"
        />
      </label>

      <label class="field">
        <span class="step-heading">{{ 'SETTINGS.CUSTOM_INPUT_RESOLUTION.TITLE' | t }}</span>
        <div class="row">
          <ui-toggle
            [checked]="settings.useCustomWidth()"
            (checkedChange)="settings.useCustomWidth.set($event)"
          />
          <input
            type="number"
            min="0"
            [value]="settings.customWidth()"
            (input)="settings.customWidth.set(+$any($event.target).value)"
          />
        </div>
      </label>

      <label class="field">
        <span class="step-heading">{{ 'SETTINGS.CUSTOM_MODELS.TITLE' | t }}</span>
        <ui-button variant="ghost" (click)="pickCustomModels()">
          {{ 'SETTINGS.CUSTOM_MODELS.BUTTON_FOLDER' | t }}
        </ui-button>
        @if (settings.customModelsPath()) {
          <p class="path">{{ settings.customModelsPath() }}</p>
        }
      </label>

      <div class="row">
        <ui-toggle
          [checked]="settings.ttaMode()"
          (checkedChange)="settings.ttaMode.set($event)"
        />
        <span>TTA Mode</span>
      </div>

      <ui-button variant="ghost" (click)="settings.resetAll()">
        {{ 'SETTINGS.RESET_SETTINGS.BUTTON_TITLE' | t }}
      </ui-button>

      <p class="version">Upscayl {{ state.appVersion() }}</p>
    </div>
  `,
  styles: `
    .panel-scroll {
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      padding: var(--space-5);
    }
    textarea,
    input[type='text'],
    input[type='number'] {
      width: 100%;
      padding: 0.5rem;
      border-radius: var(--radius-btn);
      border: 1px solid var(--color-base-300);
      background: var(--color-base-200);
      color: inherit;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .path {
      font-size: 0.75rem;
      word-break: break-all;
    }
    .version {
      font-size: 0.75rem;
      opacity: 0.6;
    }
    a {
      color: inherit;
      text-decoration: none;
    }
  `,
})
export class SettingsTabComponent {
  readonly settings = inject(SettingsService);
  readonly state = inject(UpscaylStateService);
  private readonly tauri = inject(TauriService);
  readonly formats = ['png', 'jpg', 'webp'] as const;

  copyLogs(): void {
    navigator.clipboard.writeText(this.state.logs().join('\n'));
  }

  onTheme(event: Event): void {
    this.settings.theme.set((event.target as HTMLSelectElement).value);
  }

  async pickCustomModels(): Promise<void> {
    const path = await open({ directory: true, multiple: false });
    if (typeof path !== 'string') return;
    if (!path.replace(/\\/g, '/').endsWith('/models')) {
      alert('Custom models folder must be named "models".');
      return;
    }
    this.settings.customModelsPath.set(path);
    await this.tauri.invoke('set_custom_models_path', { path });
    const models = await this.tauri.invoke<string[]>('get_models_list', {
      customDir: path,
    });
    this.state.customModelIds.set(models);
  }
}
