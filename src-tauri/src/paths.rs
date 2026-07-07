use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

const DEFAULT_MODELS: &[&str] = &[
    "upscayl-standard-4x",
    "upscayl-lite-4x",
    "high-fidelity-4x",
    "remacri-4x",
    "ultramix-balanced-4x",
    "ultrasharp-4x",
    "digital-art-4x",
];

pub fn is_default_model(model: &str) -> bool {
    DEFAULT_MODELS.contains(&model)
}

pub fn decode_path(path: &str) -> String {
    percent_encoding::percent_decode_str(path)
        .decode_utf8_lossy()
        .into_owned()
}

pub fn get_directory_from_path(path: &str) -> String {
    Path::new(path)
        .parent()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_string())
}

pub fn get_filename_from_path(path: &str) -> String {
    Path::new(path)
        .file_name()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

pub fn get_file_stem(path: &str) -> String {
    Path::new(path)
        .file_stem()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_default()
}

/// Repo root (parent of `src-tauri/`), stable in dev and prod builds.
fn repo_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .expect("src-tauri directory must have a parent")
        .to_path_buf()
}

pub fn bundled_models_path(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        return repo_root().join("resources").join("models");
    }

    app.path()
        .resource_dir()
        .ok()
        .map(|dir| dir.join("models"))
        .filter(|path| path.exists())
        .unwrap_or_else(|| repo_root().join("resources").join("models"))
}

pub fn resolve_models_path(app: &AppHandle, custom_models_path: Option<&str>) -> PathBuf {
    if let Some(custom) = custom_models_path {
        let custom = PathBuf::from(custom);
        if custom.exists() {
            return custom;
        }
    }
    bundled_models_path(app)
}

/// Canonicalize and normalize separators for the upscayl-ncnn CLI on Windows.
pub fn path_for_sidecar(path: impl AsRef<Path>) -> String {
    let path = path.as_ref();
    let resolved = if path.exists() {
        std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf())
    } else {
        path.to_path_buf()
    };

    let mut normalized = resolved.to_string_lossy().to_string();
    if cfg!(windows) {
        if normalized.starts_with(r"\\?\") {
            normalized = normalized[4..].to_string();
        }
        normalized = normalized.replace('/', "\\");
    }
    normalized
}
