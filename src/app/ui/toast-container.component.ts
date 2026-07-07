import { Component, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  template: `
    <div class="toasts">
      @for (msg of toast.messages(); track msg.id) {
        <div class="toast" (click)="toast.dismiss(msg.id)">
          @if (msg.title) {
            <strong>{{ msg.title }}</strong>
          }
          <p>{{ msg.description }}</p>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-width: 360px;
    }
    .toast {
      background: var(--color-base-200);
      border: 1px solid var(--color-base-300);
      border-left: 4px solid var(--color-primary);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-btn);
      box-shadow: var(--shadow);
      cursor: pointer;
    }
    .toast p {
      margin: 0.25rem 0 0;
      font-size: 0.9rem;
    }
  `,
})
export class UiToastContainerComponent {
  readonly toast = inject(ToastService);
}
