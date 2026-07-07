export const MODELS = {
  "upscayl-standard-4x": {
    id: "upscayl-standard-4x",
  },
  "upscayl-lite-4x": {
    id: "upscayl-lite-4x",
  },
  "high-fidelity-4x": {
    id: "high-fidelity-4x",
  },
  "remacri-4x": {
    id: "remacri-4x",
  },
  "ultramix-balanced-4x": {
    id: "ultramix-balanced-4x",
  },
  "ultrasharp-4x": {
    id: "ultrasharp-4x",
  },
  "digital-art-4x": {
    id: "digital-art-4x",
  },
} as const;

export type ModelId = keyof typeof MODELS;

/** Models licensed for non-commercial use only. */
export const NON_COMMERCIAL_MODELS: ReadonlySet<ModelId> = new Set([
  "remacri-4x",
  "ultramix-balanced-4x",
  "ultrasharp-4x",
]);

export function isNonCommercialModel(model: string): boolean {
  return NON_COMMERCIAL_MODELS.has(model as ModelId);
}

export function hasModelComparison(model: string): model is ModelId {
  return model in MODELS;
}
