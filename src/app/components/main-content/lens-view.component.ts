import { Component, input, signal, HostListener } from '@angular/core';

@Component({
  selector: 'app-lens-view',
  standalone: true,
  template: `
    <div
      class="lens-root"
      (mousemove)="onMove($event)"
      (mouseleave)="hovering.set(false)"
      (mouseenter)="hovering.set(true)"
    >
      <img [src]="afterSrc()" alt="Upscaled" class="base" />
      @if (hovering()) {
        <div
          class="lens"
          [style.left.px]="x() - size() / 2"
          [style.top.px]="y() - size() / 2"
          [style.width.px]="size()"
          [style.height.px]="size()"
        >
          <img
            [src]="beforeSrc()"
            alt="Original"
            [style.transform]="transform()"
          />
        </div>
      }
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

    .lens-root {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .base {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lens {
      position: absolute;
      border-radius: 50%;
      overflow: hidden;
      border: 2px solid var(--color-primary);
      pointer-events: none;
      box-shadow: var(--shadow);
    }
    .lens img {
      position: absolute;
      width: 400%;
      height: 400%;
      object-fit: contain;
      max-width: none;
    }
  `,
})
export class LensViewComponent {
  readonly beforeSrc = input.required<string>();
  readonly afterSrc = input.required<string>();
  readonly size = input(120);
  readonly x = signal(0);
  readonly y = signal(0);
  readonly hovering = signal(false);
  readonly transform = signal('translate(0, 0)');

  @HostListener('mousemove', ['$event'])
  onMove(event: MouseEvent): void {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const lx = event.clientX - rect.left;
    const ly = event.clientY - rect.top;
    this.x.set(lx);
    this.y.set(ly);
    const zoom = 4;
    const tx = -lx * zoom + this.size() / 2;
    const ty = -ly * zoom + this.size() / 2;
    this.transform.set(`translate(${tx}px, ${ty}px)`);
  }
}
