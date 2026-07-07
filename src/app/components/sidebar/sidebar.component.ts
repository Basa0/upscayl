import { Component, inject, signal } from "@angular/core";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { UpscaylTabComponent } from "./upscayl-tab.component";
import { SettingsTabComponent } from "./settings-tab.component";
import { SettingsService } from "../../services/settings.service";
import { TauriService } from "../../services/tauri.service";
import { UpscaylStateService } from "../../services/upscayl-state.service";

@Component({
  selector: "app-sidebar",
  imports: [TranslatePipe, UpscaylTabComponent, SettingsTabComponent],
  template: `
    <aside class="sidebar" [class.hidden]="!settings.showSidebar()">
      @if (tauri.platform() === "mac") {
        <div class="mac-titlebar"></div>
      }
      <header class="header">
        <h1>{{ "TITLE" | t }}</h1>
        <p class="version">v{{ state.appVersion() }}</p>
      </header>

      <div class="tab-list" role="tablist">
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="tab() === 'upscale'"
          (click)="tab.set('upscale')"
        >
          Upscale
        </button>
        <button
          type="button"
          role="tab"
          [attr.aria-selected]="tab() === 'settings'"
          (click)="tab.set('settings')"
        >
          {{ "SETTINGS.TITLE" | t }}
        </button>
      </div>

      <div class="tab-panel">
        @if (tab() === "upscale") {
          <app-upscayl-tab />
        } @else {
          <app-settings-tab />
        }
      </div>

      <footer class="footer">
        <span>{{ "FOOTER.COPYRIGHT" | t }} Upscayl</span>
      </footer>

      <button
        class="collapse-btn"
        type="button"
        (click)="settings.showSidebar.set(false)"
      >
        ‹
      </button>
    </aside>
    @if (!settings.showSidebar()) {
      <button
        class="expand-btn"
        type="button"
        (click)="settings.showSidebar.set(true)"
      >
        ›
      </button>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-shrink: 0;
      height: 100%;
      position: relative;
    }

    .sidebar {
      flex: 1;
      min-height: 0;
      width: 100%;
    }
    .header {
      padding: 1rem 1.25rem 0.5rem;
      flex-shrink: 0;
    }
    .header h1 {
      margin: 0;
      font-size: 1.25rem;
    }
    .version {
      margin: 0.25rem 0 0;
      font-size: 0.75rem;
      opacity: 0.7;
    }
    .tab-list {
      display: flex;
      gap: 0.25rem;
      padding: 0 1rem;
      flex-shrink: 0;
    }
    .tab-list button {
      flex: 1;
      border: none;
      background: transparent;
      padding: 0.5rem;
      border-bottom: 2px solid transparent;
      color: var(--color-base-content);
      cursor: pointer;
    }
    .tab-list button[aria-selected="true"] {
      border-color: var(--color-primary);
      color: var(--color-primary);
      font-weight: 700;
    }
    .tab-panel {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-base-300) transparent;
    }
    .tab-panel::-webkit-scrollbar {
      width: 6px;
    }
    .tab-panel::-webkit-scrollbar-track {
      background: transparent;
    }
    .tab-panel::-webkit-scrollbar-thumb {
      background: var(--color-base-300);
      border-radius: 999px;
    }
    .tab-panel::-webkit-scrollbar-thumb:hover {
      background: color-mix(
        in srgb,
        var(--color-base-content) 20%,
        var(--color-base-300)
      );
    }
    .footer {
      padding: 0.75rem 1rem;
      font-size: 0.7rem;
      opacity: 0.6;
      border-top: 1px solid var(--color-base-300);
      flex-shrink: 0;
    }
    .collapse-btn,
    .expand-btn {
      position: absolute;
      top: 50%;
      right: -14px;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--color-base-300);
      background: var(--color-base-100);
      cursor: pointer;
      z-index: 10;
    }
    .expand-btn {
      position: fixed;
      left: 0.5rem;
      top: 50%;
    }
  `,
})
export class SidebarComponent {
  readonly settings = inject(SettingsService);
  readonly tauri = inject(TauriService);
  readonly state = inject(UpscaylStateService);
  readonly tab = signal<"upscale" | "settings">("upscale");
}
