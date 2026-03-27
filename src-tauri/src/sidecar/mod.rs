use std::sync::Mutex;

pub struct SidecarState {
    pub pid: Mutex<Option<u32>>,
}

impl Default for SidecarState {
    fn default() -> Self {
        Self {
            pid: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub fn spawn_python_sidecar(
    script_path: String,
    state: tauri::State<'_, SidecarState>,
) -> Result<u32, String> {
    use std::process::Command;

    let child = Command::new("python")
        .arg(&script_path)
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}", e))?;

    let pid = child.id();
    let mut current_pid = state
        .pid
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    *current_pid = Some(pid);

    Ok(pid)
}

#[tauri::command]
pub fn stop_python_sidecar(
    state: tauri::State<'_, SidecarState>,
) -> Result<bool, String> {
    let mut current_pid = state
        .pid
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(pid) = current_pid.take() {
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/PID", &pid.to_string(), "/F"])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = std::process::Command::new("kill")
                .args(["-TERM", &pid.to_string()])
                .output();
        }
        Ok(true)
    } else {
        Ok(false)
    }
}
