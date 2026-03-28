use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum RecordingState {
    Recording,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingStatus {
    pub state: RecordingState,
    pub consent_given: bool,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceCloneResult {
    pub voice_id: String,
    pub name: String,
    pub success: bool,
}

/// Managed state for voice clone recording.
pub struct VoiceCloneState {
    inner: Mutex<VoiceCloneInner>,
}

struct VoiceCloneInner {
    status: RecordingStatus,
    /// Timestamp when recording started (epoch ms)
    started_at: Option<u64>,
    /// Accumulated audio data (raw bytes, base64-encoded for transport)
    audio_buffer: Vec<u8>,
}

impl Default for VoiceCloneState {
    fn default() -> Self {
        Self {
            inner: Mutex::new(VoiceCloneInner {
                status: RecordingStatus {
                    state: RecordingState::Stopped,
                    consent_given: false,
                    duration_ms: 0,
                },
                started_at: None,
                audio_buffer: Vec::new(),
            }),
        }
    }
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

/// Start audio recording for voice clone.
///
/// **Requires explicit consent.** The `consent` flag must be `true` or the
/// command will return an error.  This ensures the user has acknowledged that
/// their voice will be recorded and uploaded to ElevenLabs for cloning.
#[tauri::command]
pub fn start_recording(
    consent: bool,
    state: State<'_, VoiceCloneState>,
) -> Result<RecordingStatus, String> {
    if !consent {
        return Err(
            "Voice recording requires explicit consent. The user must confirm they agree to have their voice recorded and uploaded for cloning."
                .to_string(),
        );
    }

    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if inner.status.state == RecordingState::Recording {
        return Err("Recording is already in progress".to_string());
    }

    inner.status.consent_given = true;
    inner.status.state = RecordingState::Recording;
    inner.status.duration_ms = 0;
    inner.started_at = Some(epoch_ms());
    inner.audio_buffer.clear();

    // In a full implementation this would open the default audio input device
    // via cpal/rodio and start capturing PCM samples into audio_buffer.

    Ok(inner.status.clone())
}

/// Stop recording and return the captured audio data as a base64 string.
#[tauri::command]
pub fn stop_recording(
    state: State<'_, VoiceCloneState>,
) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine};

    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if inner.status.state != RecordingState::Recording {
        return Err("No recording in progress".to_string());
    }

    // Calculate duration
    if let Some(started) = inner.started_at {
        inner.status.duration_ms = epoch_ms().saturating_sub(started);
    }

    inner.status.state = RecordingState::Stopped;
    inner.started_at = None;

    // Return the captured audio as base64
    // In a real implementation audio_buffer would contain actual PCM/WAV data
    let audio_b64 = BASE64.encode(&inner.audio_buffer);

    Ok(audio_b64)
}

/// Upload voice clone audio data to ElevenLabs.
///
/// `name` - Display name for the cloned voice.
/// `audio_data` - Base64-encoded audio data (WAV/MP3).
///
/// This requires the ELEVENLABS_API_KEY environment variable to be set,
/// or it can be provided through the app's secure settings store.
#[tauri::command]
pub async fn upload_voice_clone(
    name: String,
    audio_data: String,
) -> Result<VoiceCloneResult, String> {
    use base64::{engine::general_purpose::STANDARD as BASE64, Engine};

    if name.trim().is_empty() {
        return Err("Voice clone name cannot be empty".to_string());
    }

    let audio_bytes = BASE64
        .decode(&audio_data)
        .map_err(|e| format!("Failed to decode audio data: {}", e))?;

    if audio_bytes.is_empty() {
        return Err("Audio data is empty".to_string());
    }

    // Get API key from environment
    let api_key = std::env::var("ELEVENLABS_API_KEY")
        .map_err(|_| "ELEVENLABS_API_KEY environment variable is not set".to_string())?;

    // Build multipart form for ElevenLabs Add Voice endpoint
    let part = reqwest::multipart::Part::bytes(audio_bytes)
        .file_name("recording.wav")
        .mime_str("audio/wav")
        .map_err(|e| format!("Failed to create multipart part: {}", e))?;

    let form = reqwest::multipart::Form::new()
        .text("name", name.clone())
        .part("files", part);

    let client = reqwest::Client::new();
    let response = client
        .post("https://api.elevenlabs.io/v1/voices/add")
        .header("xi-api-key", &api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Failed to upload to ElevenLabs: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "unknown error".to_string());
        return Err(format!(
            "ElevenLabs API returned {}: {}",
            status, body
        ));
    }

    #[derive(Deserialize)]
    struct ElevenLabsResponse {
        voice_id: String,
    }

    let result: ElevenLabsResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse ElevenLabs response: {}", e))?;

    Ok(VoiceCloneResult {
        voice_id: result.voice_id,
        name,
        success: true,
    })
}
