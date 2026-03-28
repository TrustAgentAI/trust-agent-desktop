mod commands;
mod sidecar;

use commands::agent::AgentStore;
use commands::audio::AmbientAudioState;
use commands::file_upload::FileUploadState;
use commands::permissions::PermissionStore;
use commands::voice_clone::VoiceCloneState;
use commands::wake_word::WakeWordState;
use sidecar::SidecarState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::default().build())
        .manage(PermissionStore::default())
        .manage(AgentStore::default())
        .manage(AmbientAudioState::default())
        .manage(WakeWordState::default())
        .manage(VoiceCloneState::default())
        .manage(FileUploadState::default())
        .manage(SidecarState::default())
        .invoke_handler(tauri::generate_handler![
            // Permissions
            commands::permissions::grant_folder_permission,
            commands::permissions::revoke_folder_permission,
            commands::permissions::list_folder_permissions,
            // Agent sessions
            commands::agent::start_agent_session,
            commands::agent::send_agent_message,
            commands::agent::stop_agent_session,
            // System
            commands::system::get_system_info,
            // Brain file operations
            commands::brain::read_brain,
            commands::brain::write_brain,
            commands::brain::encrypt_brain,
            commands::brain::decrypt_brain,
            commands::brain::get_brain_path,
            // Ambient audio
            commands::audio::play_ambient,
            commands::audio::stop_ambient,
            commands::audio::set_volume,
            commands::audio::get_audio_status,
            // Wake word detection
            commands::wake_word::start_listening,
            commands::wake_word::stop_listening,
            commands::wake_word::set_wake_word,
            // Voice cloning
            commands::voice_clone::start_recording,
            commands::voice_clone::stop_recording,
            commands::voice_clone::upload_voice_clone,
            // File upload
            commands::file_upload::select_file,
            commands::file_upload::upload_file,
            commands::file_upload::get_upload_status,
            // Sidecar
            sidecar::spawn_python_sidecar,
            sidecar::stop_python_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Trust Agent");
}
