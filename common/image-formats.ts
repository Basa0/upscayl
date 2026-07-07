export const imageFormats = ["png", "jpg", "jpeg", "webp"] as const;
export const IMAGE_FORMATS = imageFormats;
export type ImageFormat = (typeof imageFormats)[number];
