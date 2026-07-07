import { Injectable, signal } from "@angular/core";
import en from "../../assets/locales/en.json";

type Dict = Record<string, unknown>;

@Injectable({ providedIn: "root" })
export class TranslationService {
  private readonly dict = signal<Dict>(en as Dict);

  t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split(".");
    let cur: unknown = this.dict();
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in (cur as Dict)) {
        cur = (cur as Dict)[part];
      } else {
        return key;
      }
    }
    let text = typeof cur === "string" ? cur : key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }
}
