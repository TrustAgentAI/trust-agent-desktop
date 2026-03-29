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
/// rodio types (OutputStream, Sink, etc.) are **not** Send/Sync and therefore
/// cannot live inside Tauri managed state directly.  Instead we keep only the
/// logical status here and spawn a dedicated audio thread when playback is
/// requested.  Communication with that thread happens through a command channel.
pub struct AmbientAudioState {
    status: Mutex<AudioStatus>,
    /// A sender to command the audio thread.
    /// `None` means no audio thread is running.
    cmd_tx: Mutex<Option<std::sync::mpsc::Sender<AudioCommand>>>,
}

/// Commands sent to the dedicated audio thread.
enum AudioCommand {
    Play { bytes: Vec<u8>, volume: f32 },
    Stop,
    SetVolume(f32),
}

impl Default for AmbientAudioState {
    fn default() -> Self {
        Self {
            status: Mutex::new(AudioStatus {
                state: AudioState::Stopped,
                volume: 1.0,
                url: None,
            }),
            cmd_tx: Mutex::new(None),
        }
    }
}

/// Spawn a dedicated audio thread that owns all rodio resources.
/// Returns a sender that can be used to control playback.
fn spawn_audio_thread() -> std::sync::mpsc::Sender<AudioCommand> {
    let (tx, rx) = std::sync::mpsc::channel::<AudioCommand>();

    std::thread::spawn(move || {
        // These rodio types are NOT Send - they live entirely on this thread.
        let mut stream: Option<rodio::OutputStream> = None;
        let mut stream_handle: Option<rodio::OutputStreamHandle> = None;
        let mut sink: Option<rodio::Sink> = None;

        while let Ok(cmd) = rx.recv() {
            match cmd {
                AudioCommand::Play { bytes, volume } => {
                    // Stop any existing playback
                    if let Some(ref s) = sink {
                        s.stop();
                    }
                    sink = None;

                    // Create a new output stream if needed
                    if stream.is_none() {
                        match rodio::OutputStream::try_default() {
                            Ok((s, h)) => {
                                stream = Some(s);
                                stream_handle = Some(h);
                            }
                            Err(e) => {
                                eprintln!("Failed to open audio output: {}", e);
                                continue;
                            }
                        }
                    }

                    let handle = match stream_handle.as_ref() {
                        Some(h) => h,
                        None => continue,
                    };

                    let new_sink = match rodio::Sink::try_new(handle) {
                        Ok(s) => s,
                        Err(e) => {
                            eprintln!("Failed to create audio sink: {}", e);
                            continue;
                        }
                    };

                    let cursor = std::io::Cursor::new(bytes);
                    match rodio::Decoder::new(cursor) {
                        Ok(source) => {
                            new_sink
                                .append(rodio::source::Source::repeat_infinite(source));
                            new_sink.set_volume(volume);
                            sink = Some(new_sink);
                        }
                        Err(e) => {
                            eprintln!("Failed to decode audio: {}", e);
                        }
                    }
                }
                AudioCommand::Stop => {
                    if let Some(ref s) = sink {
                        s.stop();
                    }
                    sink = None;
                }
                AudioCommand::SetVolume(v) => {
                    if let Some(ref s) = sink {
                        s.set_volume(v);
                    }
                }
            }
        }
    });

    tx
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
    // Fetch audio bytes from the URL (no locks held across await)
    let bytes = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to fetch audio from URL: {}", e))?
        .bytes()
        .await
        .map_err(|e| format!("Failed to read audio bytes: {}", e))?;

    let audio_bytes = bytes.to_vec();

    // Now acquire locks only for sync operations (no await after this)
    let volume = {
        let status = state
            .status
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        status.volume
    };

    // Ensure we have an audio thread running
    {
        let mut cmd_tx = state
            .cmd_tx
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if cmd_tx.is_none() {
            *cmd_tx = Some(spawn_audio_thread());
        }
        if let Some(ref tx) = *cmd_tx {
            tx.send(AudioCommand::Play {
                bytes: audio_bytes,
                volume,
            })
            .map_err(|e| format!("Failed to send play command: {}", e))?;
        }
    }

    // Update status
    let mut status = state
        .status
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    status.state = AudioState::Playing;
    status.url = Some(url);

    Ok(status.clone())
}

/// Stop ambient audio playback.
#[tauri::command]
pub fn stop_ambient(state: State<'_, AmbientAudioState>) -> Result<AudioStatus, String> {
    {
        let cmd_tx = state
            .cmd_tx
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if let Some(ref tx) = *cmd_tx {
            let _ = tx.send(AudioCommand::Stop);
        }
    }

    let mut status = state
        .status
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    status.state = AudioState::Stopped;
    status.url = None;

    Ok(status.clone())
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

    {
        let cmd_tx = state
            .cmd_tx
            .lock()
            .map_err(|e| format!("Lock error: {}", e))?;
        if let Some(ref tx) = *cmd_tx {
            let _ = tx.send(AudioCommand::SetVolume(level));
        }
    }

    let mut status = state
        .status
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    status.volume = level;

    Ok(status.clone())
}

/// Get the current audio playback status.
#[tauri::command]
pub fn get_audio_status(state: State<'_, AmbientAudioState>) -> Result<AudioStatus, String> {
    let status = state
        .status
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    Ok(status.clone())
}
