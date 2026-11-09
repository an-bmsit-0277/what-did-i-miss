// Missed. — Extension Side Panel Entry Point
// Bundled with @missed/engine via `npm run build:extension` into extension/sidepanel.js
// 100% on-device heuristic catch-up companion for live WhatsApp Web chats.

import {
  SAMPLE_MESSAGES,
  analyzeConversation,
  serializeWhatsAppMessagesToText,
} from '@missed/engine';

const API_BASE_URL = 'http://localhost:3001/api';

// 1. Application State
let currentMessages = SAMPLE_MESSAGES;
let currentChatTitle = 'Payment Gateway Incident (Sample)';
let isSampleMode = true;
let completedTasks = new Set();
let activeTab = 'overview';
let activeAnalysis = analyzeConversation(currentMessages);
let currentSessionToken = null;

// 2. DOM Elements
const convTitleEl = document.getElementById('convTitle');
const msgCountEl = document.getElementById('msgCount');
const convSourceEl = document.getElementById('convSource');
const urgentCountEl = document.getElementById('urgentCount');
const tasksCountEl = document.getElementById('tasksCount');
const decisionsCountEl = document.getElementById('decisionsCount');
const tabTaskCountEl = document.getElementById('tabTaskCount');
const tabImportantCountEl = document.getElementById('tabImportantCount');
const noticeBanner = document.getElementById('noticeBanner');
const catchMeUpBtn = document.getElementById('catchMeUpBtn');
const catchBtnText = document.getElementById('catchBtnText');
const saveWorkspaceBtn = document.getElementById('saveWorkspaceBtn');
const sessionStatusEl = document.getElementById('sessionStatus');
const sampleBtn = document.getElementById('sampleBtn');
const refreshBtn = document.getElementById('refreshBtn');
const copySummaryBtn = document.getElementById('copySummaryBtn');

// 3. UI Helpers
function showNotice(text, type = 'error') {
  noticeBanner.textContent = text;
  noticeBanner.className = `notice-banner ${type}`;
}

function clearNotice() {
  noticeBanner.className = 'notice-banner hidden';
  noticeBanner.textContent = '';
}

// 4. Session Token Discovery (Shares session with Web Workspace)
async function refreshSessionToken() {
  currentSessionToken = null;

  // Strategy 1: Read from chrome.storage.local (synced via web-auth-bridge)
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    try {
      const stored = await chrome.storage.local.get(['missed_auth_token']);
      if (stored?.missed_auth_token) {
        currentSessionToken = stored.missed_auth_token;
      }
    } catch {
      /* ignore */
    }
  }

  // Strategy 2: If not in storage, inspect open Missed. web tabs via scripting
  if (!currentSessionToken && typeof chrome !== 'undefined' && chrome.tabs && chrome.scripting) {
    try {
      const tabs = await chrome.tabs.query({
        url: ['http://localhost:5173/*', 'http://127.0.0.1:5173/*'],
      });
      if (tabs.length > 0 && tabs[0].id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: () => localStorage.getItem('missed_auth_token'),
        });
        const token = results?.[0]?.result;
        if (token) {
          currentSessionToken = token;
          if (chrome.storage?.local) {
            await chrome.storage.local.set({ missed_auth_token: token });
          }
        }
      }
    } catch {
      /* ignore scripting errors if permissions restrict */
    }
  }

  // Update session status pill
  if (sessionStatusEl) {
    if (currentSessionToken) {
      sessionStatusEl.textContent = '● Workspace Connected';
      sessionStatusEl.className = 'session-pill connected';
      sessionStatusEl.title = 'Authenticated session shared with Missed. web workspace';
    } else {
      sessionStatusEl.textContent = '○ Workspace Not Linked';
      sessionStatusEl.className = 'session-pill idle';
      sessionStatusEl.title = 'Open and log into Missed. at localhost:5173 to enable saving';
    }
  }

  return currentSessionToken;
}

// 5. Render Functions
function renderUI() {
  convTitleEl.textContent = currentChatTitle;
  msgCountEl.textContent = `${currentMessages.length} messages indexed`;
  convSourceEl.textContent = isSampleMode ? 'Sample Demo' : 'WhatsApp Web Live';

  urgentCountEl.textContent = activeAnalysis.stats.urgentCount;
  tasksCountEl.textContent = activeAnalysis.stats.actionItemCount - completedTasks.size;
  decisionsCountEl.textContent = activeAnalysis.stats.decisionCount;

  tabTaskCountEl.textContent = activeAnalysis.stats.actionItemCount;
  tabImportantCountEl.textContent =
    activeAnalysis.stats.urgentCount + activeAnalysis.stats.decisionCount;

  // Overview View
  const recapBulletsEl = document.getElementById('recapBullets');
  recapBulletsEl.innerHTML = activeAnalysis.recap.summaryBullets
    .map((b) => `<li>• ${b}</li>`)
    .join('');

  // Overview: Urgent
  const overviewUrgentEl = document.getElementById('overviewUrgent');
  const urgentItems = activeAnalysis.findings.filter((f) => f.category === 'urgent');
  if (urgentItems.length === 0) {
    overviewUrgentEl.innerHTML =
      '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No urgent issues detected.</div>';
  } else {
    overviewUrgentEl.innerHTML = urgentItems.slice(0, 3).map(renderFindingCard).join('');
  }

  // Overview: Decisions
  const overviewDecisionsEl = document.getElementById('overviewDecisions');
  const decisionItems = activeAnalysis.findings.filter(
    (f) => f.category === 'decision' || f.category === 'deadline'
  );
  if (decisionItems.length === 0) {
    overviewDecisionsEl.innerHTML =
      '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No decisions or deadlines detected.</div>';
  } else {
    overviewDecisionsEl.innerHTML = decisionItems.slice(0, 3).map(renderFindingCard).join('');
  }

  // Overview: Tasks
  const overviewTasksEl = document.getElementById('overviewTasks');
  const taskItems = activeAnalysis.findings.filter((f) => f.category === 'action_item');
  if (taskItems.length === 0) {
    overviewTasksEl.innerHTML =
      '<div style="color:#8a8780;font-size:11px;padding:6px 0;">No action items detected.</div>';
  } else {
    overviewTasksEl.innerHTML = taskItems.slice(0, 3).map(renderTaskCard).join('');
  }

  // Tasks View
  const tasksListEl = document.getElementById('tasksList');
  if (taskItems.length === 0) {
    tasksListEl.innerHTML =
      '<div style="text-align:center;padding:24px;color:#8a8780;">No tasks found in conversation.</div>';
  } else {
    tasksListEl.innerHTML = taskItems.map(renderTaskCard).join('');
  }

  // Important View
  const importantListEl = document.getElementById('importantList');
  const importantItems = activeAnalysis.findings.filter((f) => f.category !== 'action_item');
  if (importantItems.length === 0) {
    importantListEl.innerHTML =
      '<div style="text-align:center;padding:24px;color:#8a8780;">No important items found.</div>';
  } else {
    importantListEl.innerHTML = importantItems.map(renderFindingCard).join('');
  }

  attachInteractiveHandlers();
}

function renderFindingCard(finding) {
  const isUrgent = finding.category === 'urgent';
  const hasDeepLink = finding.sourceRef?.startsWith('https://wa.me/');

  return `
    <div class="finding-card ${isUrgent ? 'urgent' : finding.category}">
      <div class="card-header">
        <span class="badge ${finding.category}">${finding.category}</span>
        <div class="card-actions-row">
          ${
            hasDeepLink
              ? `<a href="${finding.sourceRef}" target="_blank" class="deep-link-btn" title="Open WhatsApp deep link">wa.me ↗</a>`
              : ''
          }
          <button class="source-link-btn" data-snippet="${encodeURIComponent(
            finding.snippet
          )}" title="Scroll to message in WhatsApp Web">Source →</button>
        </div>
      </div>
      <div class="finding-title">${finding.title}</div>
      <div class="finding-snippet">"${finding.snippet}"</div>
      <div class="finding-meta">${finding.sender} • ${finding.timestamp || 'No time recorded'}</div>
    </div>
  `;
}

function renderTaskCard(task) {
  const isDone = completedTasks.has(task.id);
  const hasDeepLink = task.sourceRef?.startsWith('https://wa.me/');

  return `
    <div class="finding-card task-item ${isDone ? 'completed' : ''}">
      <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${
    isDone ? 'checked' : ''
  }>
      <div style="flex:1;min-width:0;">
        <div class="card-header">
          <span class="badge action">${task.assignee ? '@' + task.assignee : 'Task'}</span>
          <div class="card-actions-row">
            ${
              hasDeepLink
                ? `<a href="${task.sourceRef}" target="_blank" class="deep-link-btn" title="Open WhatsApp deep link">wa.me ↗</a>`
                : ''
            }
            <button class="source-link-btn" data-snippet="${encodeURIComponent(
              task.snippet
            )}" title="Scroll to message in WhatsApp Web">Source →</button>
          </div>
        </div>
        <div class="finding-snippet">"${task.snippet}"</div>
        <div class="finding-meta">${task.sender} • ${task.timestamp || 'No time recorded'}</div>
      </div>
    </div>
  `;
}

function attachInteractiveHandlers() {
  // Checkbox toggle
  document.querySelectorAll('.task-checkbox').forEach((cb) => {
    cb.onchange = (e) => {
      const id = e.target.getAttribute('data-task-id');
      if (e.target.checked) completedTasks.add(id);
      else completedTasks.delete(id);
      renderUI();
    };
  });

  // Source jump to WhatsApp Web DOM
  document.querySelectorAll('.source-link-btn').forEach((btn) => {
    btn.onclick = async (e) => {
      const snippet = decodeURIComponent(e.target.getAttribute('data-snippet'));
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const waTabs = await chrome.tabs.query({
          url: ['https://web.whatsapp.com/*', 'http://localhost/*', 'http://127.0.0.1/*'],
        });
        const targetTab =
          waTabs[0] || (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
        if (targetTab?.id) {
          chrome.tabs
            .sendMessage(targetTab.id, { type: 'HIGHLIGHT_SOURCE_MESSAGE', snippet })
            .catch(() => {});
        }
      }
    };
  });
}

// 6. Navigation Tabs
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.onclick = (e) => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach((p) => p.classList.remove('active'));

    const tab = e.target.getAttribute('data-tab');
    e.target.classList.add('active');
    document.getElementById(`${tab}View`).classList.add('active');
    activeTab = tab;
    void activeTab;
  };
});

document.querySelectorAll('.counter-card').forEach((card) => {
  card.onclick = () => {
    const targetTab = card.getAttribute('data-tab');
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    if (tabBtn) tabBtn.click();
  };
});

// 7. Core WhatsApp Live Scrape Flow ("Capture current chat")
async function triggerWhatsAppScrape() {
  clearNotice();
  catchBtnText.textContent = 'Scanning...';
  catchMeUpBtn.disabled = true;

  if (typeof chrome === 'undefined' || !chrome.tabs) {
    showNotice(
      'Extension API unavailable in standalone browser. Loaded demo conversation instead.',
      'info'
    );
    loadSampleData();
    catchBtnText.textContent = 'Capture current chat';
    catchMeUpBtn.disabled = false;
    return;
  }

  try {
    // 1. First look for WhatsApp Web / mock test tabs
    let targetTab = null;
    const waTabs = await chrome.tabs.query({
      url: ['https://web.whatsapp.com/*', 'http://localhost/*', 'http://127.0.0.1/*'],
    });

    if (waTabs.length > 0) {
      targetTab =
        waTabs.find((t) => t.url && (t.url.includes('web.whatsapp.com') || t.url.includes(':8088'))) ||
        waTabs.find((t) => t.active) ||
        waTabs[0];
    } else {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      targetTab = activeTab;
    }

    if (!targetTab || !targetTab.id) {
      showNotice('No active browser tab found.', 'error');
      catchBtnText.textContent = 'Capture current chat';
      catchMeUpBtn.disabled = false;
      return;
    }

    if (
      !targetTab.url ||
      (!targetTab.url.includes('web.whatsapp.com') &&
        !targetTab.url.includes('whatsapp') &&
        !targetTab.url.includes(':8088'))
    ) {
      showNotice(
        'Active tab is not WhatsApp Web. Open web.whatsapp.com or click "Demo".',
        'error'
      );
      catchBtnText.textContent = 'Capture current chat';
      catchMeUpBtn.disabled = false;
      return;
    }

    // Send scrape command to WhatsApp Web content script
    chrome.tabs.sendMessage(targetTab.id, { type: 'SCRAPE_WHATSAPP_CHAT' }, (response) => {
      catchBtnText.textContent = 'Capture current chat';
      catchMeUpBtn.disabled = false;

      if (chrome.runtime.lastError || !response) {
        const detail = chrome.runtime.lastError?.message || 'No response from tab';
        showNotice(
          `Could not connect to WhatsApp Web: ${detail}. Please ensure the chat tab is loaded.`,
          'error'
        );
        return;
      }

      if (!response.success) {
        showNotice(response.error || 'Failed to read messages from WhatsApp Web.', 'error');
        return;
      }

      // Success: process live messages through shared engine
      currentMessages = response.messages;
      currentChatTitle = response.chatTitle || 'Active WhatsApp Chat';
      isSampleMode = false;
      completedTasks.clear();
      activeAnalysis = analyzeConversation(currentMessages);

      showNotice(
        `✓ Captured ${currentMessages.length} messages from "${currentChatTitle}".`,
        'success'
      );
      setTimeout(clearNotice, 4000);
      renderUI();
    });
  } catch (err) {
    catchBtnText.textContent = 'Capture current chat';
    catchMeUpBtn.disabled = false;
    showNotice(`Error: ${err.message}`, 'error');
  }
}

// 8. "Save to workspace" Flow (Reuses authenticated session)
async function saveToWorkspace() {
  clearNotice();
  const token = await refreshSessionToken();

  if (!token) {
    showNotice(
      'No Missed. session detected. Sign in to Missed. at localhost:5173 to save.',
      'error'
    );
    return;
  }

  if (currentMessages.length === 0) {
    showNotice('No messages to save. Click "Capture current chat" first.', 'error');
    return;
  }

  saveWorkspaceBtn.disabled = true;
  saveWorkspaceBtn.textContent = 'Saving...';

  try {
    // Serialize conversation using shared engine function
    const serializedText = serializeWhatsAppMessagesToText(currentMessages);
    const fileName = `${currentChatTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_export.txt`;

    const res = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: currentChatTitle,
        fileName,
        format: 'txt',
        content: serializedText,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(body.message || `Server returned ${res.status}`);
    }

    showNotice(`✓ Saved "${currentChatTitle}" to workspace!`, 'success');
    saveWorkspaceBtn.textContent = 'Saved ✓';
    setTimeout(() => {
      saveWorkspaceBtn.textContent = 'Save to workspace';
      saveWorkspaceBtn.disabled = false;
    }, 3000);
  } catch (err) {
    saveWorkspaceBtn.textContent = 'Save to workspace';
    saveWorkspaceBtn.disabled = false;
    showNotice(`Failed to save: ${err.message}`, 'error');
  }
}

function loadSampleData() {
  currentMessages = SAMPLE_MESSAGES;
  currentChatTitle = 'Payment Gateway Incident (Sample)';
  isSampleMode = true;
  completedTasks.clear();
  activeAnalysis = analyzeConversation(currentMessages);
  clearNotice();
  renderUI();
}

// 9. Event Listeners
catchMeUpBtn.onclick = triggerWhatsAppScrape;
refreshBtn.onclick = () => {
  refreshSessionToken();
  if (!isSampleMode) {
    triggerWhatsAppScrape();
  } else {
    renderUI();
  }
};
sampleBtn.onclick = loadSampleData;
saveWorkspaceBtn.onclick = saveToWorkspace;

if (sessionStatusEl) {
  sessionStatusEl.onclick = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: 'http://localhost:5173/workspace' });
    }
  };
}

copySummaryBtn.onclick = async () => {
  let text = `# Catch-Up Summary: ${currentChatTitle}\n\n`;
  activeAnalysis.recap.summaryBullets.forEach((b) => (text += `- ${b}\n`));
  text += `\n## Tasks\n`;
  activeAnalysis.findings
    .filter((f) => f.category === 'action_item')
    .forEach((t) => {
      text += `- [${completedTasks.has(t.id) ? 'x' : ' '}] ${t.snippet}\n`;
    });
  await navigator.clipboard.writeText(text);
  copySummaryBtn.textContent = 'Copied!';
  setTimeout(() => (copySummaryBtn.textContent = 'Copy Summary'), 2000);
};

// Initial Render and Session Sync on Open
refreshSessionToken();
renderUI();

if (typeof window !== 'undefined') {
  window.__missed = {
    refreshSessionToken,
    triggerWhatsAppScrape,
    saveToWorkspace,
    getAnalysis: () => activeAnalysis,
    getSessionToken: () => currentSessionToken,
    getChatTitle: () => currentChatTitle,
    getMessages: () => currentMessages,
  };
}
