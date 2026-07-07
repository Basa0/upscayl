mod args;
mod commands;
mod paths;
mod types;
mod upscaler;

use std::sync::Arc;

use tauri::Manager;
use upscaler::UpscalerState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .build(),
        )
        // TODO(updater): add tauri_plugin_updater::Builder, pubkey in tauri.conf.json,
        // createUpdaterArtifacts in CI, and TAURI_SIGNING_PRIVATE_KEY secret.
        .manage(Arc::new(UpscalerState::default()))
        .invoke_handler(tauri::generate_handler![
            commands::upscayl_image,
            commands::upscayl_batch,
            commands::upscayl_double,
            commands::stop_upscayl,
            commands::get_models_list,
            commands::open_folder,
            commands::save_clipboard_image,
            commands::get_app_version,
            commands::set_custom_models_path,
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
