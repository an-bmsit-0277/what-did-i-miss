// Missed. — Web Auth Bridge Content Script
// Runs on http://localhost:5173/* and http://127.0.0.1:5173/*
// Syncs the web application session token to chrome.storage.local so the extension side panel
// can save captured conversations without requiring duplicate login.

function syncMissedSession() {
  try {
    const token = localStorage.getItem('missed_auth_token');
    if (token && typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: 'MISSED_SESSION_SYNC', token },
        () => {
          // Ignore runtime errors if extension context invalidated
          if (chrome.runtime.lastError) {
            /* noop */
          }
        }
      );
    }
  } catch {
    /* ignore storage access restrictions */
  }
}

// Initial sync on page load
syncMissedSession();

// Listen for storage events (e.g. login/logout in other tabs)
window.addEventListener('storage', (event) => {
  if (event.key === 'missed_auth_token') {
    syncMissedSession();
  }
});

// Periodic check for SPA state changes
setInterval(syncMissedSession, 2000);

