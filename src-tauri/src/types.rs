use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageUpscaylPayload {
    pub image_path: String,
    pub output_path: String,
    pub scale: String,
    pub model: String,
    pub gpu_id: Option<String>,
    pub save_image_as: String,
    pub overwrite: bool,
    pub compression: String,
    pub no_image_processing: bool,
    pub custom_width: Option<String>,
    pub use_custom_width: bool,
    pub tile_size: Option<i32>,
    pub tta_mode: bool,
    pub copy_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DoubleUpscaylPayload {
    pub model: String,
    pub image_path: String,
    pub output_path: String,
    pub scale: String,
    pub gpu_id: Option<String>,
    pub save_image_as: String,
    pub compression: String,
    pub no_image_processing: bool,
    pub custom_width: Option<String>,
    pub use_custom_width: bool,
    pub tile_size: Option<i32>,
    pub tta_mode: bool,
    pub copy_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatchUpscaylPayload {
    pub batch_folder_path: String,
    pub output_path: String,
    pub model: String,
    pub gpu_id: Option<String>,
    pub save_image_as: String,
    pub scale: String,
    pub compression: String,
    pub no_image_processing: bool,
    pub custom_width: Option<String>,
    pub use_custom_width: bool,
    pub tile_size: Option<i32>,
    pub tta_mode: bool,
    pub copy_metadata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PasteImagePayload {
    pub name: String,
    pub path: String,
    pub encoded_buffer: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppVersionInfo {
    pub version: String,
    pub suffix: String,
}
