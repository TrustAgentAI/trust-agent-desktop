mod commands;
mod sidecar;

use commands::agent::AgentStore;
use commands::permissions::PermissionStore;
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
        .manage(SidecarState::default())
        .invoke_handler(tauri::generate_handler![
            commands::permissions::grant_folder_permission,
            commands::permissions::revoke_folder_permission,
            commands::permissions::list_folder_permissions,
            commands::agent::start_agent_session,
            commands::agent::send_agent_message,
            commands::agent::stop_agent_session,
            commands::system::get_system_info,
            sidecar::spawn_python_sidecar,
            sidecar::stop_python_sidecar,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Trust Agent");
}
