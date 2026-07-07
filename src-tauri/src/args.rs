use crate::paths::is_default_model;

pub fn get_model_scale(model: &str) -> String {
    let model_name = model.to_lowercase();
    if model_name.contains("x2") || model_name.contains("2x") {
        "2".to_string()
    } else if model_name.contains("x3") || model_name.contains("3x") {
        "3".to_string()
    } else {
        "4".to_string()
    }
}

fn include_scale(model: &str, scale: &str, custom_width: &str) -> bool {
    get_model_scale(model) != scale && custom_width.is_empty()
}

pub fn get_single_image_arguments(
    input_dir: &str,
    file_name_with_ext: &str,
    out_file: &str,
    models_path: &str,
    model: &str,
    scale: &str,
    gpu_id: &str,
    save_image_as: &str,
    custom_width: &str,
    tile_size: i32,
    compression: &str,
    tta_mode: bool,
) -> Vec<String> {
    let slash = if cfg!(target_os = "windows") { "\\" } else { "/" };
    let include = include_scale(model, scale, custom_width);
    let mut args = vec![
        "-i".into(),
        format!("{input_dir}{slash}{file_name_with_ext}"),
        "-o".into(),
        out_file.into(),
    ];
    if include {
        args.push("-s".into());
        args.push(scale.into());
    }
    args.extend([
        "-m".into(),
        models_path.into(),
        "-n".into(),
        model.into(),
    ]);
    if !gpu_id.is_empty() {
        args.push("-g".into());
        args.push(gpu_id.into());
    }
    args.extend(["-f".into(), save_image_as.into()]);
    if !custom_width.is_empty() {
        args.push("-w".into());
        args.push(custom_width.into());
    }
    args.extend(["-c".into(), compression.into()]);
    if tile_size > 0 {
        args.push("-t".into());
        args.push(tile_size.to_string());
    }
    if tta_mode {
        args.push("-x".into());
    }
    args
}

pub fn get_double_upscale_arguments(
    input_dir: &str,
    full_file_name: &str,
    out_file: &str,
    models_path: &str,
    scale: &str,
    model: &str,
    gpu_id: &str,
    save_image_as: &str,
    custom_width: &str,
    tile_size: i32,
) -> Vec<String> {
    let slash = if cfg!(target_os = "windows") { "\\" } else { "/" };
    let include = include_scale(model, scale, custom_width);
    let mut args = vec![
        "-i".into(),
        format!("{input_dir}{slash}{full_file_name}"),
        "-o".into(),
        out_file.into(),
    ];
    if include {
        args.push("-s".into());
        args.push(scale.into());
    }
    args.extend([
        "-m".into(),
        models_path.into(),
        "-n".into(),
        model.into(),
    ]);
    if !gpu_id.is_empty() {
        args.push("-g".into());
        args.push(gpu_id.into());
    }
    args.extend(["-f".into(), save_image_as.into()]);
    if tile_size > 0 {
        args.push("-t".into());
        args.push(tile_size.to_string());
    }
    args
}

pub fn get_double_upscale_second_pass_arguments(
    out_file: &str,
    models_path: &str,
    model: &str,
    gpu_id: &str,
    save_image_as: &str,
    scale: &str,
    custom_width: &str,
    compression: &str,
    tile_size: i32,
    tta_mode: bool,
) -> Vec<String> {
    let include = include_scale(model, scale, custom_width);
    let mut args = vec![
        "-i".into(),
        out_file.into(),
        "-o".into(),
        out_file.into(),
    ];
    if include {
        args.push("-s".into());
        args.push(scale.into());
    }
    args.extend([
        "-m".into(),
        models_path.into(),
        "-n".into(),
        model.into(),
    ]);
    if !gpu_id.is_empty() {
        args.push("-g".into());
        args.push(gpu_id.into());
    }
    args.extend(["-f".into(), save_image_as.into()]);
    if !custom_width.is_empty() {
        args.push("-w".into());
        args.push(custom_width.into());
    }
    args.extend(["-c".into(), compression.into()]);
    if tile_size > 0 {
        args.push("-t".into());
        args.push(tile_size.to_string());
    }
    if tta_mode {
        args.push("-x".into());
    }
    args
}

pub fn get_batch_arguments(
    input_dir: &str,
    output_dir: &str,
    models_path: &str,
    model: &str,
    gpu_id: &str,
    save_image_as: &str,
    scale: &str,
    custom_width: &str,
    compression: &str,
    tile_size: i32,
    tta_mode: bool,
) -> Vec<String> {
    let include = include_scale(model, scale, custom_width);
    let mut args = vec!["-i".into(), input_dir.into(), "-o".into(), output_dir.into()];
    if include {
        args.push("-s".into());
        args.push(scale.into());
    }
    args.extend([
        "-m".into(),
        models_path.into(),
        "-n".into(),
        model.into(),
    ]);
    if !gpu_id.is_empty() {
        args.push("-g".into());
        args.push(gpu_id.into());
    }
    args.extend(["-f".into(), save_image_as.into()]);
    if !custom_width.is_empty() {
        args.push("-w".into());
        args.push(custom_width.into());
    }
    args.extend(["-c".into(), compression.into()]);
    if tile_size > 0 {
        args.push("-t".into());
        args.push(tile_size.to_string());
    }
    if tta_mode {
        args.push("-x".into());
    }
    args
}

pub fn build_output_file(
    output_dir: &str,
    file_stem: &str,
    use_custom_width: bool,
    custom_width: &str,
    scale: &str,
    model: &str,
    save_image_as: &str,
) -> String {
    let slash = if cfg!(target_os = "windows") { "\\" } else { "/" };
    let suffix = if use_custom_width && !custom_width.is_empty() {
        format!("{custom_width}px_")
    } else {
        format!("{scale}x_")
    };
    format!(
        "{output_dir}{slash}{file_stem}_upscayl_{suffix}{model}.{save_image_as}"
    )
}

pub fn build_batch_output_folder(
    output_path: &str,
    save_image_as: &str,
    model: &str,
    use_custom_width: bool,
    custom_width: &str,
    scale: &str,
) -> String {
    let slash = if cfg!(target_os = "windows") { "\\" } else { "/" };
    let scale_part = if use_custom_width && !custom_width.is_empty() {
        format!("{custom_width}px")
    } else {
        format!("{scale}x")
    };
    format!("{output_path}{slash}upscayl_{save_image_as}_{model}_{scale_part}")
}

#[allow(dead_code)]
pub fn model_is_default(model: &str) -> bool {
    is_default_model(model)
}
