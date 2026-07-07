import { Component, inject, OnInit } from "@angular/core";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { MainContentComponent } from "./components/main-content/main-content.component";
import { UiToastContainerComponent } from "./ui/toast-container.component";
import { TauriService } from "./services/tauri.service";
import { UpscaylStateService } from "./services/upscayl-state.service";
import { SettingsService } from "./services/settings.service";
import { ToastService } from "./services/toast.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [SidebarComponent, MainContentComponent, UiToastContainerComponent],
  template: `
    <div class="app-shell">
      <app-sidebar />
      <app-main-content />
      <ui-toast-container />
    </div>
  `,
})
export class AppComponent implements OnInit {
  private readonly tauri = inject(TauriService);
  private readonly state = inject(UpscaylStateService);
  private readonly settings = inject(SettingsService);
  private readonly toast = inject(ToastService);

  async ngOnInit(): Promise<void> {
    try {
      const info = await this.tauri.invoke<{ version: string }>(
        "get_app_version",
      );
      this.state.appVersion.set(info.version);
    } catch {
      this.state.appVersion.set("dev");
    }

    const unsubs: Array<() => void> = [];
    const events: Array<[string, (p: string) => void]> = [
      ["log", (p) => this.state.appendLog(p)],
      ["upscayl:progress", (p) => this.state.progress.set(p)],
      ["batch:progress", (p) => this.state.progress.set(p)],
      ["double:progress", (p) => this.state.progress.set(p)],
      [
        "upscayl:done",
        (p) => {
          this.state.upscaledImagePath.set(p);
          this.state.progress.set("");
        },
      ],
      [
        "batch:done",
        (p) => {
          this.state.upscaledBatchFolderPath.set(p);
          this.state.progress.set("");
        },
      ],
      [
        "double:done",
        (p) => {
          this.state.upscaledImagePath.set(p);
          this.state.progress.set("");
          this.state.doubleUpscaylCounter.update((n) => n + 1);
        },
      ],
      [
        "upscayl:error",
        (p) => {
          this.toast.show(p, "Error");
          this.state.progress.set("");
        },
      ],
      [
        "finishing-touches",
        () => this.state.progress.set("Adding finishing touches..."),
      ],
    ];

    for (const [event, handler] of events) {
      const un = await this.tauri.listen<string>(event, handler);
      unsubs.push(un);
    }

    if (this.settings.customModelsPath()) {
      await this.tauri.invoke("set_custom_models_path", {
        path: this.settings.customModelsPath(),
      });
      const models = await this.tauri.invoke<string[]>("get_models_list", {
        customDir: this.settings.customModelsPath(),
      });
      this.state.customModelIds.set(models);
    }
  }
}
