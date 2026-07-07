use std::sync::Arc;

use tauri::{AppHandle, Emitter, State, WebviewWindow};

use crate::types::{
    AppVersionInfo, BatchUpscaylPayload, DoubleUpscaylPayload, ImageUpscaylPayload,
    PasteImagePayload,
};
use crate::upscaler::{list_models, UpscalerState};
use crate::upscaler::{upscale_batch, upscale_double, upscale_image};

#[tauri::command]
pub async fn upscayl_image(
    app: AppHandle,
    window: WebviewWindow,
    state: State<'_, Arc<UpscalerState>>,
    payload: ImageUpscaylPayload,
) -> Result<(), String> {
    upscale_image(app, window, payload, state.inner().clone()).await
}

#[tauri::command]
pub async fn upscayl_batch(
    app: AppHandle,
    window: WebviewWindow,
    state: State<'_, Arc<UpscalerState>>,
    payload: BatchUpscaylPayload,
) -> Result<(), String> {
    upscale_batch(app, window, payload, state.inner().clone()).await
}

#[tauri::command]
pub async fn upscayl_double(
    app: AppHandle,
    window: WebviewWindow,
    state: State<'_, Arc<UpscalerState>>,
    payload: DoubleUpscaylPayload,
) -> Result<(), String> {
    upscale_double(app, window, payload, state.inner().clone()).await
}

#[tauri::command]
pub fn stop_upscayl(state: State<'_, Arc<UpscalerState>>) -> Result<(), String> {
    state.stop_all();
    Ok(())
}

#[tauri::command]
pub fn get_models_list(
    app: AppHandle,
    state: State<'_, Arc<UpscalerState>>,
    custom_dir: Option<String>,
) -> Result<Vec<String>, String> {
    if let Some(dir) = custom_dir {
        *state.custom_models_path.lock().unwrap() = Some(dir.clone());
        list_models(&dir)
    } else if let Some(dir) = state.custom_models_path.lock().unwrap().clone() {
        list_models(&dir)
    } else {
        let path = crate::paths::bundled_models_path(&app);
        list_models(&path.to_string_lossy())
    }
}

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    tauri_plugin_opener::open_path(path, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_clipboard_image(
    app: AppHandle,
    payload: PasteImagePayload,
) -> Result<String, String> {
    use base64::Engine;
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(payload.encoded_buffer)
        .map_err(|e| e.to_string())?;
    let out_path = format!(
        "{}{}{}",
        payload.path,
        if cfg!(target_os = "windows") { "\\" } else { "/" },
        payload.name
    );
    std::fs::write(&out_path, bytes).map_err(|e| e.to_string())?;
    let _ = app.emit("clipboard-image-saved", out_path.clone());
    Ok(out_path)
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> AppVersionInfo {
    AppVersionInfo {
        version: app.package_info().version.to_string(),
        suffix: "FOSS".into(),
    }
}

#[tauri::command]
pub fn set_custom_models_path(
    state: State<'_, Arc<UpscalerState>>,
    path: Option<String>,
) -> Result<(), String> {
    *state.custom_models_path.lock().unwrap() = path;
    Ok(())
}
