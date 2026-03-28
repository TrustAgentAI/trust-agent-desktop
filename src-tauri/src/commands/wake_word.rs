use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum ListeningState {
    Active,
    Inactive,
    NotSupported,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WakeWordStatus {
    pub state: ListeningState,
    pub wake_word: String,
    pub is_trustbox: bool,
}

/// Managed state for wake word detection.
///
/// Wake word detection is only supported on TrustBox hardware.  On standard
/// desktop devices all commands return a `not_supported` status without error.
pub struct WakeWordState {
    inner: Mutex<WakeWordInner>,
}

struct WakeWordInner {
    status: WakeWordStatus,
}

impl Default for WakeWordState {
    fn default() -> Self {
        Self {
            inner: Mutex::new(WakeWordInner {
                status: WakeWordStatus {
                    state: ListeningState::Inactive,
                    wake_word: "hey trust".to_string(),
                    is_trustbox: is_trustbox_device(),
                },
            }),
        }
    }
}

// ---------------------------------------------------------------------------
// TrustBox detection
// ---------------------------------------------------------------------------

/// Detect whether the current device is a TrustBox.
///
/// TrustBox identification is done via an environment variable or a marker
/// file on disk.  On non-TrustBox hardware this always returns false.
fn is_trustbox_device() -> bool {
    // Check for TrustBox environment marker
    if std::env::var("TRUSTBOX_DEVICE").is_ok() {
        return true;
    }

    // Check for TrustBox marker file
    #[cfg(target_os = "linux")]
    {
        std::path::Path::new("/etc/trustbox/device.conf").exists()
    }

    #[cfg(not(target_os = "linux"))]
    {
        false
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Begin wake word detection (TrustBox only).
///
/// On non-TrustBox devices this returns a status with state `not_supported`.
#[tauri::command]
pub fn start_listening(state: State<'_, WakeWordState>) -> Result<WakeWordStatus, String> {
    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if !inner.status.is_trustbox {
        inner.status.state = ListeningState::NotSupported;
        return Ok(inner.status.clone());
    }

    inner.status.state = ListeningState::Active;

    // On a real TrustBox this would initialise the microphone stream and
    // start running the wake word detection model.  The detected event
    // would be emitted to the frontend via tauri::Emitter::emit.

    Ok(inner.status.clone())
}

/// Stop wake word detection.
#[tauri::command]
pub fn stop_listening(state: State<'_, WakeWordState>) -> Result<WakeWordStatus, String> {
    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if !inner.status.is_trustbox {
        inner.status.state = ListeningState::NotSupported;
        return Ok(inner.status.clone());
    }

    inner.status.state = ListeningState::Inactive;

    Ok(inner.status.clone())
}

/// Configure the wake word phrase (default: "hey trust").
#[tauri::command]
pub fn set_wake_word(
    word: String,
    state: State<'_, WakeWordState>,
) -> Result<WakeWordStatus, String> {
    let trimmed = word.trim().to_lowercase();

    if trimmed.is_empty() {
        return Err("Wake word cannot be empty".to_string());
    }
    if trimmed.len() > 64 {
        return Err("Wake word is too long (max 64 characters)".to_string());
    }

    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if !inner.status.is_trustbox {
        inner.status.state = ListeningState::NotSupported;
        inner.status.wake_word = trimmed;
        return Ok(inner.status.clone());
    }

    inner.status.wake_word = trimmed;

    Ok(inner.status.clone())
}
