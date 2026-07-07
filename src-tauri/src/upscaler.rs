use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Emitter, WebviewWindow};
use tauri::window::{ProgressBarState, ProgressBarStatus};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use tokio::sync::oneshot;

use crate::args::{
    build_batch_output_folder, build_output_file, get_batch_arguments,
    get_double_upscale_arguments, get_double_upscale_second_pass_arguments,
    get_single_image_arguments,
};
use crate::paths::{
    decode_path, get_directory_from_path, get_file_stem, get_filename_from_path,
    path_for_sidecar, resolve_models_path,
};
use crate::types::{BatchUpscaylPayload, DoubleUpscaylPayload, ImageUpscaylPayload};

#[derive(Default)]
pub struct UpscalerState {
    pub stopped: AtomicBool,
    pub children: Mutex<Vec<JoinHandle<()>>>,
    pub custom_models_path: Mutex<Option<String>>,
}

impl UpscalerState {
    pub fn stop_all(&self) {
        self.stopped.store(true, Ordering::SeqCst);
        let mut children = self.children.lock().unwrap();
        for handle in children.drain(..) {
            handle.abort();
        }
    }

    pub fn reset_stopped(&self) {
        self.stopped.store(false, Ordering::SeqCst);
    }

    fn track(&self, handle: JoinHandle<()>) {
        self.children.lock().unwrap().push(handle);
    }
}

fn emit_log(app: &AppHandle, message: impl AsRef<str>) {
    let msg = message.as_ref().to_string();
    log::info!("{msg}");
    let _ = app.emit("log", msg);
}

fn set_progress(window: &WebviewWindow, value: f64) {
    let _ = window.set_progress_bar(ProgressBarState {
        status: Some(ProgressBarStatus::Normal),
        progress: Some((value * 100.0).clamp(0.0, 100.0) as u64),
    });
}

fn clear_progress(window: &WebviewWindow) {
    let _ = window.set_progress_bar(ProgressBarState {
        status: None,
        progress: None,
    });
}

fn parse_progress(data: &str) -> Option<f64> {
    let trimmed = data.trim().trim_end_matches('%');
    trimmed.parse::<f64>().ok().map(|v| v / 100.0)
}

enum RunResult {
    Success,
    Failed(String),
    Stopped,
}

async fn run_sidecar(
    app: AppHandle,
    window: WebviewWindow,
    args: Vec<String>,
    progress_event: &'static str,
    state: Arc<UpscalerState>,
) -> Result<RunResult, String> {
    state.reset_stopped();
    let shell = app.shell();
    let (mut rx, child) = shell
        .sidecar("upscayl-bin")
        .map_err(|e| e.to_string())?
        .args(args)
        .spawn()
        .map_err(|e| e.to_string())?;

    let (tx, rx_done) = oneshot::channel();
    let app_clone = app.clone();
    let window_clone = window.clone();
    let state_clone = state.clone();

    let handle = tauri::async_runtime::spawn(async move {
        let mut failed = false;
        let mut exit_code = 0i32;

        while let Some(event) = rx.recv().await {
            if state_clone.stopped.load(Ordering::SeqCst) {
                let _ = child.kill();
                let _ = tx.send(RunResult::Stopped);
                clear_progress(&window_clone);
                return;
            }
            match event {
                CommandEvent::Stdout(line) | CommandEvent::Stderr(line) => {
                    let data = String::from_utf8_lossy(&line).to_string();
                    emit_log(&app_clone, &data);
                    if data.contains("Error") || data.contains("failed") {
                        let _ = app_clone.emit("upscayl:error", &data);
                        let _ = child.kill();
                        clear_progress(&window_clone);
                        let _ = tx.send(RunResult::Failed(data));
                        return;
                    }
                    if data.contains("Resizing") {
                        let _ = app_clone.emit("finishing-touches", ());
                    }
                    if let Some(progress) = parse_progress(&data) {
                        set_progress(&window_clone, progress);
                    }
                    let _ = app_clone.emit(progress_event, data);
                }
                CommandEvent::Terminated(payload) => {
                    exit_code = payload.code.unwrap_or(1);
                    if exit_code != 0 {
                        failed = true;
                    }
                    break;
                }
                _ => {}
            }
        }

        clear_progress(&window_clone);

        if state_clone.stopped.load(Ordering::SeqCst) {
            let _ = tx.send(RunResult::Stopped);
        } else if failed {
            let _ = tx.send(RunResult::Failed(format!("Process exited with code {exit_code}")));
        } else {
            let _ = tx.send(RunResult::Success);
        }
    });

    state.track(handle);
    rx_done.await.map_err(|_| "Sidecar task dropped".to_string())
}

fn gpu_id(payload_gpu: &Option<String>) -> String {
    payload_gpu.clone().unwrap_or_default()
}

fn custom_width(payload: &Option<String>, use_custom: bool) -> String {
    if use_custom {
        payload.clone().unwrap_or_default()
    } else {
        String::new()
    }
}

fn tile_size(payload: &Option<i32>) -> i32 {
    payload.unwrap_or(0)
}

pub async fn upscale_image(
    app: AppHandle,
    window: WebviewWindow,
    payload: ImageUpscaylPayload,
    state: Arc<UpscalerState>,
) -> Result<(), String> {
    let image_path = decode_path(&payload.image_path);
    let input_dir = get_directory_from_path(&image_path);
    let output_dir = decode_path(&payload.output_path);
    let file_name = get_filename_from_path(&image_path);
    let file_stem = get_file_stem(&image_path);
    let custom_width = custom_width(&payload.custom_width, payload.use_custom_width);
    let gpu = gpu_id(&payload.gpu_id);
    let tile = tile_size(&payload.tile_size);

    let out_file = build_output_file(
        &output_dir,
        &file_stem,
        payload.use_custom_width,
        &custom_width,
        &payload.scale,
        &payload.model,
        &payload.save_image_as,
    );

    if out_file.len() >= 255 && cfg!(target_os = "windows") {
        let _ = app.emit(
            "upscayl:error",
            "The filename exceeds the maximum path length allowed by Windows.",
        );
        return Ok(());
    }

    if std::path::Path::new(&out_file).exists() && !payload.overwrite {
        emit_log(&app, format!("Already upscayled at: {out_file}"));
        let _ = app.emit("upscayl:done", out_file);
        return Ok(());
    }

    let custom_path = state.custom_models_path.lock().unwrap().clone();
    let models_path = resolve_models_path(&app, custom_path.as_deref());
    let models_path_str = path_for_sidecar(&models_path);

    let args = get_single_image_arguments(
        &path_for_sidecar(Path::new(&input_dir)),
        &file_name,
        &path_for_sidecar(Path::new(&out_file)),
        &models_path_str,
        &payload.model,
        &payload.scale,
        &gpu,
        &payload.save_image_as,
        &custom_width,
        tile,
        &payload.compression,
        payload.tta_mode,
    );

    match run_sidecar(app.clone(), window, args, "upscayl:progress", state).await? {
        RunResult::Success => {
            let _ = app.emit("upscayl:done", out_file);
            if !payload.copy_metadata {
                // TODO(metadata): copy EXIF when a reliable Rust crate is wired
            }
        }
        RunResult::Failed(msg) => {
            let _ = app.emit("upscayl:error", msg);
        }
        RunResult::Stopped => {}
    }
    Ok(())
}

pub async fn upscale_batch(
    app: AppHandle,
    window: WebviewWindow,
    payload: BatchUpscaylPayload,
    state: Arc<UpscalerState>,
) -> Result<(), String> {
    let input_dir = decode_path(&payload.batch_folder_path);
    let output_path = decode_path(&payload.output_path);
    let custom_width = custom_width(&payload.custom_width, payload.use_custom_width);
    let gpu = gpu_id(&payload.gpu_id);
    let tile = tile_size(&payload.tile_size);

    let output_folder = build_batch_output_folder(
        &output_path,
        &payload.save_image_as,
        &payload.model,
        payload.use_custom_width,
        &custom_width,
        &payload.scale,
    );

    std::fs::create_dir_all(&output_folder).map_err(|e| e.to_string())?;

    let custom_path = state.custom_models_path.lock().unwrap().clone();
    let models_path = resolve_models_path(&app, custom_path.as_deref());
    let models_path_str = path_for_sidecar(&models_path);

    let args = get_batch_arguments(
        &path_for_sidecar(Path::new(&input_dir)),
        &path_for_sidecar(Path::new(&output_folder)),
        &models_path_str,
        &payload.model,
        &gpu,
        &payload.save_image_as,
        &payload.scale,
        &custom_width,
        &payload.compression,
        tile,
        payload.tta_mode,
    );

    match run_sidecar(app.clone(), window, args, "batch:progress", state).await? {
        RunResult::Success => {
            let _ = app.emit("batch:done", output_folder);
        }
        RunResult::Failed(msg) => {
            let _ = app.emit("upscayl:error", msg);
        }
        RunResult::Stopped => {}
    }
    Ok(())
}

pub async fn upscale_double(
    app: AppHandle,
    window: WebviewWindow,
    payload: DoubleUpscaylPayload,
    state: Arc<UpscalerState>,
) -> Result<(), String> {
    let image_path = decode_path(&payload.image_path);
    let input_dir = get_directory_from_path(&image_path);
    let output_dir = decode_path(&payload.output_path);
    let full_file_name = get_filename_from_path(&image_path);
    let file_stem = get_file_stem(&image_path);
    let custom_width = custom_width(&payload.custom_width, payload.use_custom_width);
    let gpu = gpu_id(&payload.gpu_id);
    let tile = tile_size(&payload.tile_size);

    let out_file = build_output_file(
        &output_dir,
        &file_stem,
        payload.use_custom_width,
        &custom_width,
        &payload.scale,
        &payload.model,
        &payload.save_image_as,
    );

    let custom_path = state.custom_models_path.lock().unwrap().clone();
    let models_path = resolve_models_path(&app, custom_path.as_deref());
    let models_path_str = path_for_sidecar(&models_path);

    let pass1 = get_double_upscale_arguments(
        &path_for_sidecar(Path::new(&input_dir)),
        &full_file_name,
        &path_for_sidecar(Path::new(&out_file)),
        &models_path_str,
        &payload.scale,
        &payload.model,
        &gpu,
        &payload.save_image_as,
        &custom_width,
        tile,
    );

    match run_sidecar(
        app.clone(),
        window.clone(),
        pass1,
        "double:progress",
        state.clone(),
    )
    .await?
    {
        RunResult::Stopped => return Ok(()),
        RunResult::Failed(msg) => {
            let _ = app.emit("upscayl:error", msg);
            return Ok(());
        }
        RunResult::Success => {}
    }

    let pass2 = get_double_upscale_second_pass_arguments(
        &path_for_sidecar(Path::new(&out_file)),
        &models_path_str,
        &payload.model,
        &gpu,
        &payload.save_image_as,
        &payload.scale,
        &custom_width,
        &payload.compression,
        tile,
        payload.tta_mode,
    );

    match run_sidecar(app.clone(), window, pass2, "double:progress", state).await? {
        RunResult::Success => {
            let _ = app.emit("double:done", out_file);
        }
        RunResult::Failed(msg) => {
            let _ = app.emit("upscayl:error", msg);
        }
        RunResult::Stopped => {}
    }
    Ok(())
}

pub fn list_models(path: &str) -> Result<Vec<String>, String> {
    let mut models = Vec::new();
    for entry in std::fs::read_dir(path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.ends_with(".param") {
            models.push(name.trim_end_matches(".param").to_string());
        }
    }
    models.sort();
    Ok(models)
}
