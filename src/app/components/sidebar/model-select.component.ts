import { Component, ElementRef, inject, viewChild } from '@angular/core';
import {
  hasModelComparison,
  ModelId,
  MODELS
} from '@common/models-list';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SettingsService } from '../../services/settings.service';
import { TranslationService } from '../../services/translation.service';
import { UpscaylStateService } from '../../services/upscayl-state.service';

@Component({
  selector: 'app-model-select',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <p class="step-heading">{{ 'APP.MODEL_SELECTION.TITLE' | t }}</p>

    <button type="button" class="picker-trigger" (click)="openDialog()">
      <span class="picker-trigger-label">{{ 'APP.MODEL_SELECTION.DESCRIPTION' | t }}</span>
      <span class="picker-trigger-value">{{ selectedModelLabel() }}</span>
    </button>

    <dialog #pickerDialog class="picker-dialog" (click)="onDialogBackdrop($event)">
      <div class="picker-panel" (click)="$event.stopPropagation()">
        <header class="picker-header">
          <h2>{{ 'APP.MODEL_SELECTION.DESCRIPTION' | t }}</h2>
          <button type="button" class="close-btn" (click)="closeDialog()" aria-label="Close">
            ×
          </button>
        </header>

        <div class="model-grid">
          @for (modelId of builtInModels; track modelId) {
            <button
              type="button"
              class="model-card"
              [class.selected]="settings.selectedModelId() === modelId"
              (click)="selectModel(modelId)"
            >
              <div class="model-card-head">
                <p class="model-name">
                  {{ 'APP.MODEL_SELECTION.MODELS.' + modelId + '.NAME' | t }}
                </p>
              </div>
              <p class="model-desc">
                {{ 'APP.MODEL_SELECTION.MODELS.' + modelId + '.DESCRIPTION' | t }}
              </p>
              <div class="comparison">
                <img
                  [src]="comparisonSrc(modelId, 'before')"
                  [alt]="'APP.MODEL_SELECTION.BEFORE' | t"
                  loading="lazy"
                />
                <img
                  [src]="comparisonSrc(modelId, 'after')"
                  [alt]="'APP.MODEL_SELECTION.AFTER' | t"
                  loading="lazy"
                />
                <span class="comparison-label before">{{ 'APP.MODEL_SELECTION.BEFORE' | t }}</span>
                <span class="comparison-label after">{{ 'APP.MODEL_SELECTION.AFTER' | t }}</span>
                <span class="comparison-divider" aria-hidden="true"></span>
              </div>
            </button>
          }
        </div>

        @if (state.customModelIds().length > 0) {
          <p class="custom-heading">{{ 'APP.MODEL_SELECTION.IMPORTED_CUSTOM_MODELS' | t }}</p>
          <div class="custom-models">
            @for (customModel of state.customModelIds(); track customModel) {
              <button
                type="button"
                class="custom-model"
                [class.selected]="settings.selectedModelId() === customModel"
                (click)="selectModel(customModel)"
              >
                {{ customModel }}
              </button>
            }
          </div>
        }
      </div>
    </dialog>
  `,
  styles: `
    .step-heading {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 0.5rem;
    }

    .picker-trigger {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.25rem;
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--color-base-300);
      border-radius: var(--radius-btn);
      background: var(--color-primary);
      color: var(--color-primary-content);
      cursor: pointer;
      text-align: left;
      font: inherit;
    }

    .picker-trigger:hover {
      filter: brightness(1.08);
    }

    .picker-trigger-label {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.85;
    }

    .picker-trigger-value {
      font-size: 0.95rem;
      font-weight: 600;
    }

    .picker-dialog {
      border: none;
      padding: 0;
      width: min(98vw, 112rem);
      max-width: 98vw;
      background: transparent;
    }

    .picker-dialog::backdrop {
      background: rgba(0, 0, 0, 0.55);
    }

    .picker-panel {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      max-height: 94vh;
      padding: 1.25rem 1.5rem 1.5rem;
      border-radius: var(--radius-box);
      background: var(--color-base-100);
      color: var(--color-base-content);
      border: 1px solid var(--color-base-300);
      overflow: auto;
    }

    .picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .picker-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .close-btn {
      flex-shrink: 0;
      width: 2rem;
      height: 2rem;
      border: none;
      border-radius: var(--radius-btn);
      background: var(--color-base-200);
      color: inherit;
      font-size: 1.35rem;
      line-height: 1;
      cursor: pointer;
    }

    .close-btn:hover {
      filter: brightness(1.08);
    }

    .model-grid {
      --grid-gap: 1rem;
      display: grid;
      gap: var(--grid-gap);
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    @media (max-width: 1100px) {
      .model-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .model-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    .model-card {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
      min-width: 18rem;
      padding: 0.85rem;
      border: 2px solid var(--color-base-300);
      border-radius: var(--radius-box);
      background: var(--color-base-200);
      color: inherit;
      cursor: pointer;
      text-align: left;
      font: inherit;
    }

    .model-card:hover {
      border-color: var(--color-primary);
    }

    .model-card.selected {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 1px var(--color-primary);
    }

    .model-card-head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem;
    }

    .model-name {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .model-desc {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.4;
      color: color-mix(in srgb, var(--color-base-content) 72%, transparent);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .comparison {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      aspect-ratio: 2 / 1;
      min-height: clamp(10rem, 20vw, 18rem);
      overflow: hidden;
      border-radius: calc(var(--radius-box) - 2px);
      margin-top: 0.25rem;
    }

    .comparison img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .comparison-divider {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 1px;
      background: rgba(255, 255, 255, 0.55);
      transform: translateX(-50%);
      pointer-events: none;
    }

    .comparison-label {
      position: absolute;
      bottom: 0.5rem;
      padding: 0.2rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(0, 0, 0, 0.55);
      color: #fff;
      pointer-events: none;
    }

    .comparison-label.before {
      left: 0.5rem;
    }

    .comparison-label.after {
      right: 0.5rem;
    }

    .custom-heading {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .custom-models {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .custom-model {
      padding: 0.5rem 0.75rem;
      border: 2px solid var(--color-base-300);
      border-radius: var(--radius-btn);
      background: var(--color-base-200);
      color: inherit;
      cursor: pointer;
      font: inherit;
      font-size: 0.85rem;
    }

    .custom-model.selected {
      border-color: var(--color-primary);
    }
  `,
})
export class ModelSelectComponent {
  readonly settings = inject(SettingsService);
  readonly state = inject(UpscaylStateService);
  private readonly i18n = inject(TranslationService);
  private readonly pickerDialog = viewChild<ElementRef<HTMLDialogElement>>('pickerDialog');

  readonly builtInModels = Object.keys(MODELS) as ModelId[];

  selectedModelLabel(): string {
    const id = this.settings.selectedModelId();
    if (hasModelComparison(id)) {
      return this.i18n.t(`APP.MODEL_SELECTION.MODELS.${id}.NAME`);
    }
    return id;
  }

  comparisonSrc(modelId: ModelId, side: 'before' | 'after'): string {
    return `/model-comparison/${modelId}/${side}.webp`;
  }

  openDialog(): void {
    this.pickerDialog()?.nativeElement.showModal();
  }

  closeDialog(): void {
    this.pickerDialog()?.nativeElement.close();
  }

  onDialogBackdrop(event: MouseEvent): void {
    if (event.target === this.pickerDialog()?.nativeElement) {
      this.closeDialog();
    }
  }

  selectModel(model: string): void {
    this.settings.selectedModelId.set(model);
    this.closeDialog();
  }
}
