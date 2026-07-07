import { Component, model } from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "ui-toggle",
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="toggle">
      <input
        type="checkbox"
        [ngModel]="checked()"
        (ngModelChange)="checked.set($event)"
      />
      <span class="slider"></span>
    </label>
  `,
  styles: `
    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      inset: 0;
      background: var(--color-base-300);
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .slider::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      background: var(--color-base-100);
      border-radius: 50%;
      transition: transform 0.2s;
    }
    input:checked + .slider {
      background: var(--color-primary);
    }
    input:checked + .slider::before {
      transform: translateX(20px);
    }
  `,
})
export class UiToggleComponent {
  readonly checked = model(false);
}
