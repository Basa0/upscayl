import { Injectable, signal, effect } from "@angular/core";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

@Injectable({ providedIn: "root" })
export class SettingsService {
  readonly customModelsPath = signal<string | null>(
    readStorage("customModelsPath", null),
  );
  readonly selectedModelId = signal(
    readStorage("selectedModelId", "upscayl-standard-4x"),
  );
  readonly doubleUpscayl = signal(readStorage("doubleUpscayl", false));
  readonly gpuId = signal(readStorage("gpuId", ""));
  readonly saveImageAs = signal<"png" | "jpg" | "webp">(
    readStorage("saveImageAs", "png"),
  );
  readonly scale = signal(readStorage("scale", "4"));
  readonly savedOutputPath = signal<string | null>(
    readStorage("savedOutputPath", null),
  );
  readonly rememberOutputFolder = signal(
    readStorage("rememberOutputFolder", false),
  );
  readonly compression = signal(readStorage("compression", 0));
  readonly overwrite = signal(readStorage("overwrite", false));
  readonly turnOffNotifications = signal(
    readStorage("turnOffNotifications", false),
  );
  readonly ttaMode = signal(readStorage("ttaMode", false));
  readonly viewType = signal<"slider" | "lens">(
    readStorage("viewType", "slider"),
  );
  readonly lensSize = signal(readStorage("lensSize", 100));
  readonly customWidth = signal(readStorage("customWidth", 0));
  readonly useCustomWidth = signal(readStorage("useCustomWidth", false));
  readonly tileSize = signal<number | null>(readStorage("tileSize", null));
  readonly showSidebar = signal(readStorage("showSidebar", true));
  readonly autoUpdate = signal(readStorage("autoUpdate", true));
  readonly theme = signal(readStorage("theme", "dark"));
  readonly copyMetadata = signal(readStorage("copyMetadata", false));
  readonly noImageProcessing = signal(readStorage("noImageProcessing", false));
  readonly userStats = signal(
    readStorage("userStats", {
      totalUpscayls: 0,
      doubleUpscayls: 0,
      batchUpscayls: 0,
      imageUpscayls: 0,
      averageUpscaylTime: 0,
      lastUpscaylDuration: 0,
      lastUsedAt: 0,
    }),
  );

  readonly availableThemes = ["dark", "light", "dracula", "nord", "synthwave"];

  constructor() {
    this.persist("customModelsPath", this.customModelsPath);
    this.persist("selectedModelId", this.selectedModelId);
    this.persist("doubleUpscayl", this.doubleUpscayl);
    this.persist("gpuId", this.gpuId);
    this.persist("saveImageAs", this.saveImageAs);
    this.persist("scale", this.scale);
    this.persist("savedOutputPath", this.savedOutputPath);
    this.persist("rememberOutputFolder", this.rememberOutputFolder);
    this.persist("compression", this.compression);
    this.persist("overwrite", this.overwrite);
    this.persist("turnOffNotifications", this.turnOffNotifications);
    this.persist("ttaMode", this.ttaMode);
    this.persist("viewType", this.viewType);
    this.persist("lensSize", this.lensSize);
    this.persist("customWidth", this.customWidth);
    this.persist("useCustomWidth", this.useCustomWidth);
    this.persist("tileSize", this.tileSize);
    this.persist("showSidebar", this.showSidebar);
    this.persist("autoUpdate", this.autoUpdate);
    this.persist("theme", this.theme);
    this.persist("copyMetadata", this.copyMetadata);
    this.persist("noImageProcessing", this.noImageProcessing);
    this.persist("userStats", this.userStats);
    this.applyTheme(this.theme());
    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
    });
  }

  private persist<T>(key: string, sig: ReturnType<typeof signal<T>>): void {
    effect(() => {
      localStorage.setItem(key, JSON.stringify(sig()));
    });
  }

  applyTheme(name: string): void {
    const theme = this.availableThemes.includes(name) ? name : "dark";
    document.documentElement.setAttribute("data-theme", theme);
    if (theme !== name) {
      this.theme.set(theme);
    }
  }

  resetAll(): void {
    const keys = [
      "customModelsPath",
      "selectedModelId",
      "doubleUpscayl",
      "gpuId",
      "saveImageAs",
      "scale",
      "savedOutputPath",
      "rememberOutputFolder",
      "compression",
      "overwrite",
      "turnOffNotifications",
      "ttaMode",
      "viewType",
      "lensSize",
      "customWidth",
      "useCustomWidth",
      "tileSize",
      "showSidebar",
      "autoUpdate",
      "theme",
      "copyMetadata",
      "noImageProcessing",
      "userStats",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    location.reload();
  }
}
