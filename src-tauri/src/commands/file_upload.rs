use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum UploadState {
    Pending,
    Uploading,
    Completed,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileSelection {
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub mime_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadStatus {
    pub upload_id: String,
    pub state: UploadState,
    pub file_name: String,
    pub session_id: String,
    pub bytes_uploaded: u64,
    pub total_bytes: u64,
    pub url: Option<String>,
    pub error: Option<String>,
}

/// Managed state for tracking file uploads.
pub struct FileUploadState {
    uploads: Mutex<HashMap<String, UploadStatus>>,
}

impl Default for FileUploadState {
    fn default() -> Self {
        Self {
            uploads: Mutex::new(HashMap::new()),
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Validate a file path to prevent path traversal.
fn validate_path(path: &str) -> Result<(), String> {
    if path.is_empty() {
        return Err("File path cannot be empty".to_string());
    }

    // Reject path traversal patterns
    if path.contains("..") {
        return Err("Path traversal is not allowed".to_string());
    }

    // Reject null bytes
    if path.contains('\0') {
        return Err("Path contains invalid characters".to_string());
    }

    Ok(())
}

/// Guess MIME type from file extension.
fn guess_mime(path: &str) -> String {
    let ext = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    match ext.as_str() {
        "pdf" => "application/pdf",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt" => "application/vnd.ms-powerpoint",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "txt" => "text/plain",
        "csv" => "text/csv",
        "json" => "application/json",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "mp4" => "video/mp4",
        "webm" => "video/webm",
        "zip" => "application/zip",
        _ => "application/octet-stream",
    }
    .to_string()
}

fn epoch_ms() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Open a native file picker dialog and return the selected file info.
///
/// Uses the Tauri dialog plugin to present a native file chooser.
#[tauri::command]
pub async fn select_file(app: tauri::AppHandle) -> Result<FileSelection, String> {
    use tauri_plugin_dialog::DialogExt;

    let file_path = app
        .dialog()
        .file()
        .add_filter(
            "Documents",
            &[
                "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "json", "png",
                "jpg", "jpeg", "gif", "webp", "mp3", "wav", "mp4", "zip",
            ],
        )
        .blocking_pick_file();

    let file_response = file_path.ok_or_else(|| "No file selected".to_string())?;

    let path_str = file_response.path.to_string_lossy().to_string();
    validate_path(&path_str)?;

    let metadata = std::fs::metadata(&path_str)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let file_name = std::path::Path::new(&path_str)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    Ok(FileSelection {
        path: path_str.clone(),
        name: file_name,
        size_bytes: metadata.len(),
        mime_type: guess_mime(&path_str),
    })
}

/// Upload a file to S3 using a pre-signed URL obtained from the backend.
///
/// `path` - Local file system path (must have been selected via select_file).
/// `session_id` - The session this file is associated with.
#[tauri::command]
pub async fn upload_file(
    path: String,
    session_id: String,
    state: State<'_, FileUploadState>,
) -> Result<UploadStatus, String> {
    validate_path(&path)?;

    let file_path = std::path::Path::new(&path);
    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();

    let metadata = std::fs::metadata(&path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let upload_id = format!("upload_{}_{}", session_id, epoch_ms());
    let mime = guess_mime(&path);

    let status = UploadStatus {
        upload_id: upload_id.clone(),
        state: UploadState::Uploading,
        file_name: file_name.clone(),
        session_id: session_id.clone(),
        bytes_uploaded: 0,
        total_bytes: metadata.len(),
        url: None,
        error: None,
    };

    // Register the upload in state
    {
        let mut uploads = state
            .uploads
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        uploads.insert(upload_id.clone(), status.clone());
    }

    // Read file bytes
    let file_bytes = tokio::fs::read(&path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    // Request a pre-signed upload URL from the backend
    let api_base =
        std::env::var("TRUST_AGENT_API_URL").unwrap_or_else(|_| "https://api.trustagent.ai".to_string());

    let client = reqwest::Client::new();

    #[derive(Serialize)]
    struct SignedUrlRequest {
        file_name: String,
        content_type: String,
        session_id: String,
    }

    #[derive(Deserialize)]
    struct SignedUrlResponse {
        upload_url: String,
        file_url: String,
    }

    let signed_resp = client
        .post(format!("{}/uploads/signed-url", api_base))
        .json(&SignedUrlRequest {
            file_name: file_name.clone(),
            content_type: mime.clone(),
            session_id: session_id.clone(),
        })
        .send()
        .await
        .map_err(|e| format!("Failed to get signed URL: {}", e))?;

    if !signed_resp.status().is_success() {
        let err_body = signed_resp
            .text()
            .await
            .unwrap_or_else(|_| "unknown".to_string());
        let mut uploads = state
            .uploads
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if let Some(u) = uploads.get_mut(&upload_id) {
            u.state = UploadState::Failed;
            u.error = Some(err_body.clone());
        }
        return Err(format!("Failed to get signed URL: {}", err_body));
    }

    let signed: SignedUrlResponse = signed_resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse signed URL response: {}", e))?;

    // Upload to S3 via the pre-signed URL
    let upload_resp = client
        .put(&signed.upload_url)
        .header("Content-Type", &mime)
        .body(file_bytes.clone())
        .send()
        .await
        .map_err(|e| format!("S3 upload failed: {}", e))?;

    let mut uploads = state
        .uploads
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if upload_resp.status().is_success() {
        if let Some(u) = uploads.get_mut(&upload_id) {
            u.state = UploadState::Completed;
            u.bytes_uploaded = file_bytes.len() as u64;
            u.url = Some(signed.file_url);
        }
    } else {
        let err_text = upload_resp
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        if let Some(u) = uploads.get_mut(&upload_id) {
            u.state = UploadState::Failed;
            u.error = Some(err_text);
        }
    }

    uploads
        .get(&upload_id)
        .cloned()
        .ok_or_else(|| "Upload tracking lost".to_string())
}

/// Check the progress / status of an upload.
#[tauri::command]
pub fn get_upload_status(
    upload_id: String,
    state: State<'_, FileUploadState>,
) -> Result<UploadStatus, String> {
    let uploads = state
        .uploads
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    uploads
        .get(&upload_id)
        .cloned()
        .ok_or_else(|| format!("Upload not found: {}", upload_id))
}
