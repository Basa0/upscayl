import {
  Component,
  computed,
  input,
  signal,
  HostListener,
  ElementRef,
  inject,
} from "@angular/core";

@Component({
  selector: "app-comparison-slider",
  standalone: true,
  template: `
    <div
      class="slider"
      #root
      (pointerdown)="onDown($event)"
      (pointermove)="onMove($event)"
    >
      <!-- Upscaled: visible only to the right of the handle -->
      <img
        class="layer after"
        [src]="afterSrc()"
        alt="Upscaled"
        draggable="false"
        [style.clip-path]="afterClip()"
      />
      <!-- Original: visible only to the left of the handle -->
      <img
        class="layer before"
        [src]="beforeSrc()"
        alt="Original"
        draggable="false"
        [style.clip-path]="beforeClip()"
      />
      <div class="handle" [style.left.%]="position()"></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
    }

    .slider {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: var(--radius-box);
      user-select: none;
      touch-action: none;
      background: var(--color-base-200);
    }

    .layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      pointer-events: none;
    }

    .handle {
      position: absolute;
      top: 0;
      bottom: 0;
      z-index: 1;
      width: 3px;
      background: var(--color-primary);
      transform: translateX(-50%);
      box-shadow: 0 0 8px
        color-mix(in srgb, var(--color-primary) 50%, transparent);
      pointer-events: none;
    }
  `,
})
export class ComparisonSliderComponent {
  readonly beforeSrc = input.required<string>();
  readonly afterSrc = input.required<string>();
  readonly position = signal(50);
  private dragging = false;
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Left of handle: show original only. */
  readonly beforeClip = computed(
    () => `inset(0 ${100 - this.position()}% 0 0)`,
  );

  /** Right of handle: show upscaled only. */
  readonly afterClip = computed(() => `inset(0 0 0 ${this.position()}%)`);

  @HostListener("window:pointerup")
  onUp(): void {
    this.dragging = false;
  }

  onDown(event: PointerEvent): void {
    this.dragging = true;
    this.update(event);
  }

  onMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.update(event);
  }

  private update(event: PointerEvent): void {
    const rect = this.el.nativeElement
      .querySelector(".slider")!
      .getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    this.position.set((x / rect.width) * 100);
  }
}
