use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ---------------------------------------------------------------------------
// Audio state
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AudioState {
    Playing,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioStatus {
    pub state: AudioState,
    pub volume: f32,
    pub url: Option<String>,
}

/// Managed state for ambient audio playback.
///
/// Actual audio streaming is handled by the rodio crate.  We store a handle
/// to the current sink so that we can pause / stop / adjust volume.
pub struct AmbientAudioState {
    inner: Mutex<AmbientAudioInner>,
}

struct AmbientAudioInner {
    status: AudioStatus,
    /// rodio OutputStream must be kept alive for the duration of playback.
    _stream: Option<rodio::OutputStream>,
    /// Handle to the output stream, needed for creating sinks.
    stream_handle: Option<rodio::OutputStreamHandle>,
    /// The active sink (controls playback).
    sink: Option<rodio::Sink>,
}

impl Default for AmbientAudioState {
    fn default() -> Self {
        Self {
            inner: Mutex::new(AmbientAudioInner {
                status: AudioStatus {
                    state: AudioState::Stopped,
                    volume: 1.0,
                    url: None,
                },
                _stream: None,
                stream_handle: None,
                sink: None,
            }),
        }
    }
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Start playing ambient audio from a URL.
///
/// The audio is fetched over HTTP and decoded into a looping playback stream
/// via rodio.  Only one ambient track plays at a time - calling this while
/// audio is already playing will stop the previous track first.
#[tauri::command]
pub async fn play_ambient(
    url: String,
    state: State<'_, AmbientAudioState>,
) -> Result<AudioStatus, String> {
    // Fetch audio bytes from the URL
    let bytes = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch audio from URL: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read audio bytes: {}", e))?;

    let cursor = std::io::Cursor::new(bytes.to_vec());

    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    // Stop any existing playback
    if let Some(ref sink) = inner.sink {
        sink.stop();
    }

    // Create a new output stream if we don't have one
    if inner._stream.is_none() {
        let (stream, handle) = rodio::OutputStream::try_default()
            .map_err(|e| format!("Failed to open audio output: {}", e))?;
        inner._stream = Some(stream);
        inner.stream_handle = Some(handle);
    }

    let handle = inner
        .stream_handle
        .as_ref()
        .ok_or_else(|| "No audio output handle available".to_string())?;

    let sink =
        rodio::Sink::try_new(handle).map_err(|e| format!("Failed to create audio sink: {}", e))?;

    // Decode and append the audio source
    let source = rodio::Decoder::new(cursor)
        .map_err(|e| format!("Failed to decode audio: {}", e))?;

    // Loop the ambient track by using repeat_infinite
    sink.append(rodio::source::Source::repeat_infinite(source));
    sink.set_volume(inner.status.volume);

    inner.sink = Some(sink);
    inner.status.state = AudioState::Playing;
    inner.status.url = Some(url);

    Ok(inner.status.clone())
}

/// Stop ambient audio playback.
#[tauri::command]
pub fn stop_ambient(state: State<'_, AmbientAudioState>) -> Result<AudioStatus, String> {
    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(ref sink) = inner.sink {
        sink.stop();
    }
    inner.sink = None;
    inner.status.state = AudioState::Stopped;
    inner.status.url = None;

    Ok(inner.status.clone())
}

/// Set the ambient audio volume (0.0 to 1.0).
#[tauri::command]
pub fn set_volume(
    level: f32,
    state: State<'_, AmbientAudioState>,
) -> Result<AudioStatus, String> {
    if !(0.0..=1.0).contains(&level) {
        return Err("Volume must be between 0.0 and 1.0".to_string());
    }

    let mut inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    inner.status.volume = level;

    if let Some(ref sink) = inner.sink {
        sink.set_volume(level);
    }

    Ok(inner.status.clone())
}

/// Get the current audio playback status.
#[tauri::command]
pub fn get_audio_status(state: State<'_, AmbientAudioState>) -> Result<AudioStatus, String> {
    let inner = state
        .inner
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(inner.status.clone())
}
