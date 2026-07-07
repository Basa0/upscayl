import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  title?: string;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private seq = 0;
  readonly messages = signal<ToastMessage[]>([]);

  show(description: string, title?: string): void {
    const id = ++this.seq;
    this.messages.update((m) => [...m, { id, title, description }]);
    setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    this.messages.update((m) => m.filter((x) => x.id !== id));
  }
}
