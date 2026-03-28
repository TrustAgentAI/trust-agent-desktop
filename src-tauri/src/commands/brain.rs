use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::PathBuf;
use tauri::Manager;

/// Extension for Trust Agent brain files
const BRAIN_EXT: &str = "tagnt";

/// Subdirectory within app data for brain storage
const BRAINS_DIR: &str = "brains";

/// Nonce length for AES-256-GCM (96 bits / 12 bytes)
const NONCE_LEN: usize = 12;

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainData {
    pub hire_id: String,
    pub payload: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedPayload {
    /// Base64-encoded nonce + ciphertext
    pub ciphertext: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainPathResult {
    pub path: String,
    pub exists: bool,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// Derive a 256-bit key from an arbitrary passphrase via SHA-256.
fn derive_key(key: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(key.as_bytes());
    let result = hasher.finalize();
    let mut out = [0u8; 32];
    out.copy_from_slice(&result);
    out
}

/// Validate a hire_id to prevent path traversal attacks.
/// Only alphanumeric, hyphens, and underscores are allowed.
fn validate_hire_id(hire_id: &str) -> Result<(), String> {
    if hire_id.is_empty() {
        return Err("hire_id cannot be empty".to_string());
    }
    if hire_id.len() > 128 {
        return Err("hire_id is too long".to_string());
    }
    if !hire_id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("hire_id contains invalid characters - only alphanumeric, hyphens, and underscores are allowed".to_string());
    }
    Ok(())
}

/// Resolve the brains directory inside app data.
fn brains_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data directory: {}", e))?;
    Ok(app_data.join(BRAINS_DIR))
}

/// Build the full path for a brain file, ensuring safety.
fn brain_file_path(app: &tauri::AppHandle, hire_id: &str) -> Result<PathBuf, String> {
    validate_hire_id(hire_id)?;
    let dir = brains_dir(app)?;
    Ok(dir.join(format!("{}.{}", hire_id, BRAIN_EXT)))
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Read a .tagnt brain file from local app data.
/// Returns the raw (encrypted) contents as a string.
#[tauri::command]
pub async fn read_brain(app: tauri::AppHandle, hire_id: String) -> Result<String, String> {
    let path = brain_file_path(&app, &hire_id)?;

    if !path.exists() {
        return Err(format!("Brain file not found for hire_id: {}", hire_id));
    }

    tokio::fs::read_to_string(&path)
        .await
        .map_err(|e| format!("Failed to read brain file: {}", e))
}

/// Write an encrypted .tagnt brain file to local app data.
#[tauri::command]
pub async fn write_brain(
    app: tauri::AppHandle,
    hire_id: String,
    data: String,
) -> Result<bool, String> {
    let path = brain_file_path(&app, &hire_id)?;

    // Ensure the brains directory exists
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Failed to create brains directory: {}", e))?;
    }

    tokio::fs::write(&path, data.as_bytes())
        .await
        .map_err(|e| format!("Failed to write brain file: {}", e))?;

    Ok(true)
}

/// Encrypt data using AES-256-GCM.
/// Returns a base64-encoded string of nonce + ciphertext.
#[tauri::command]
pub fn encrypt_brain(data: String, key: String) -> Result<EncryptedPayload, String> {
    let key_bytes = derive_key(&key);
    let cipher =
        Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| format!("Cipher init error: {}", e))?;

    // Generate a random 12-byte nonce
    let nonce_bytes: [u8; NONCE_LEN] = {
        use aes_gcm::aead::rand_core::RngCore;
        let mut buf = [0u8; NONCE_LEN];
        OsRng.fill_bytes(&mut buf);
        buf
    };
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Prepend nonce to ciphertext and base64-encode
    let mut combined = Vec::with_capacity(NONCE_LEN + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);

    Ok(EncryptedPayload {
        ciphertext: BASE64.encode(&combined),
    })
}

/// Decrypt data using AES-256-GCM.
/// Expects base64-encoded nonce + ciphertext.
#[tauri::command]
pub fn decrypt_brain(data: String, key: String) -> Result<String, String> {
    let key_bytes = derive_key(&key);
    let cipher =
        Aes256Gcm::new_from_slice(&key_bytes).map_err(|e| format!("Cipher init error: {}", e))?;

    let combined = BASE64
        .decode(&data)
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    if combined.len() < NONCE_LEN {
        return Err("Invalid encrypted data: too short".to_string());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(NONCE_LEN);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext).map_err(|e| format!("UTF-8 decode error: {}", e))
}

/// Get the local file system path for a brain file.
#[tauri::command]
pub fn get_brain_path(app: tauri::AppHandle, hire_id: String) -> Result<BrainPathResult, String> {
    let path = brain_file_path(&app, &hire_id)?;
    let exists = path.exists();

    Ok(BrainPathResult {
        path: path.to_string_lossy().to_string(),
        exists,
    })
}
