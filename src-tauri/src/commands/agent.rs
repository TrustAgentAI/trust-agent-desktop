use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSession {
    pub session_id: String,
    pub model: String,
    pub started_at: u64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub role: String,
    pub content: String,
    pub timestamp: u64,
}

pub struct AgentStore {
    pub sessions: Mutex<HashMap<String, AgentSession>>,
}

impl Default for AgentStore {
    fn default() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
        }
    }
}

fn unix_now() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[tauri::command]
pub fn start_agent_session(
    model: String,
    store: State<'_, AgentStore>,
) -> Result<AgentSession, String> {
    let session_id = format!("session_{}", unix_now());

    let session = AgentSession {
        session_id: session_id.clone(),
        model,
        started_at: unix_now(),
        active: true,
    };

    let mut sessions = store
        .sessions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;
    sessions.insert(session_id, session.clone());

    Ok(session)
}

#[tauri::command]
pub fn send_agent_message(
    session_id: String,
    content: String,
    store: State<'_, AgentStore>,
) -> Result<AgentMessage, String> {
    let sessions = store
        .sessions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "Session not found".to_string())?;

    if !session.active {
        return Err("Session is not active".to_string());
    }

    // Message is prepared for dispatch to the API backend
    Ok(AgentMessage {
        role: "user".to_string(),
        content,
        timestamp: unix_now(),
    })
}

#[tauri::command]
pub fn stop_agent_session(
    session_id: String,
    store: State<'_, AgentStore>,
) -> Result<bool, String> {
    let mut sessions = store
        .sessions
        .lock()
        .map_err(|e| format!("Lock error: {}", e))?;

    if let Some(session) = sessions.get_mut(&session_id) {
        session.active = false;
        Ok(true)
    } else {
        Err("Session not found".to_string())
    }
}
