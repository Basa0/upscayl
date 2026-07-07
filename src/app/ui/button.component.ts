import { Component, input } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `<button [class]="classes()" [disabled]="disabled()" [type]="type()"><ng-content /></button>`,
  styles: `
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: var(--radius-btn);
      border: none;
      cursor: pointer;
      font-weight: 600;
      transition: filter 0.15s;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    button:hover:not(:disabled) {
      filter: brightness(1.08);
    }
    .primary {
      background: var(--color-primary);
      color: var(--color-primary-content);
    }
    .secondary {
      background: var(--color-secondary);
      color: var(--color-secondary-content);
    }
    .ghost {
      background: var(--color-base-200);
      color: var(--color-base-content);
    }
    .sm {
      padding: 0.35rem 0.65rem;
      font-size: 0.85rem;
    }
  `,
})
export class UiButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'ghost'>('primary');
  readonly size = input<'md' | 'sm'>('md');
  readonly disabled = input(false);
  readonly type = input<'button' | 'submit'>('button');

  classes(): string {
    return `${this.variant()} ${this.size()}`;
  }
}
