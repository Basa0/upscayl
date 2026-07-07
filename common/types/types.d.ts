export type ImageFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

export type ImageUpscaylPayload = {
  imagePath: string;
  outputPath: string;
  scale: string;
  model: string;
  gpuId: string | null;
  saveImageAs: ImageFormat;
  overwrite: boolean;
  compression: string;
  noImageProcessing: boolean;
  customWidth: string | null;
  useCustomWidth: boolean;
  tileSize: number | null;
  ttaMode: boolean;
  copyMetadata: boolean;
};

export type DoubleUpscaylPayload = {
  model: string;
  imagePath: string;
  outputPath: string;
  scale: string;
  gpuId: string | null;
  saveImageAs: ImageFormat;
  compression: string;
  noImageProcessing: boolean;
  customWidth: string | null;
  useCustomWidth: boolean;
  tileSize: number | null;
  ttaMode: boolean;
  copyMetadata: boolean;
};

export type BatchUpscaylPayload = {
  batchFolderPath: string;
  outputPath: string;
  model: string;
  gpuId: string | null;
  saveImageAs: ImageFormat;
  scale: string;
  compression: string;
  noImageProcessing: boolean;
  customWidth: string | null;
  useCustomWidth: boolean;
  tileSize: number | null;
  ttaMode: boolean;
  copyMetadata: boolean;
};
