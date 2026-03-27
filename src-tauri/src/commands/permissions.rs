use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderPermission {
    pub path: String,
    pub read: bool,
    pub write: bool,
    pub granted_at: String,
}

pub struct PermissionStore {
    pub permissions: Mutex<HashMap<String, FolderPermission>>,
}

impl Default for PermissionStore {
    fn default() -> Self {
        Self {
            permissions: Mutex::new(HashMap::new()),
        }
    }
}

fn validate_path(path: &str) -> Result<PathBuf, String> {
    let path_buf = PathBuf::from(path);

    if !path_buf.is_absolute() {
        return Err("Path must be absolute".to_string());
    }

    let canonical = path_buf
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;

    // Block system-critical directories
    let blocked_prefixes = [
        "/System",
        "/usr",
        "/bin",
        "/sbin",
        "C:\\Windows",
        "C:\\Program Files",
    ];

    let path_str = canonical.to_string_lossy();
    for prefix in &blocked_prefixes {
        if path_str.starts_with(prefix) {
            return Err(format!("Access to {} is not permitted", prefix));
        }
    }

    Ok(canonical)
}

#[tauri::command]
pub fn grant_folder_permission(
    path: String,
    read: bool,
    write: bool,
    store: State<'_, PermissionStore>,
) -> Result<FolderPermission, String> {
    let validated = validate_path(&path)?;
    let path_key = validated.to_string_lossy().to_string();

    let permission = FolderPermission {
        path: path_key.clone(),
        read,
        write,
        granted_at: chrono_now(),
    };

    let mut perms = store
        .permissions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    perms.insert(path_key, permission.clone());

    Ok(permission)
}

#[tauri::command]
pub fn revoke_folder_permission(
    path: String,
    store: State<'_, PermissionStore>,
) -> Result<bool, String> {
    let validated = validate_path(&path)?;
    let path_key = validated.to_string_lossy().to_string();

    let mut perms = store
        .permissions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(perms.remove(&path_key).is_some())
}

#[tauri::command]
pub fn list_folder_permissions(
    store: State<'_, PermissionStore>,
) -> Result<Vec<FolderPermission>, String> {
    let perms = store
        .permissions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(perms.values().cloned().collect())
}

fn chrono_now() -> String {
    // Simple ISO timestamp without chrono dependency
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", now.as_secs())
}
