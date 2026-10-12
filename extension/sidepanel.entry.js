// Missed. — Extension Side Panel Entry Point
// Bundled with @missed/engine via `npm run build:extension` into extension/sidepanel.js
// 100% on-device heuristic catch-up companion for WhatsApp Web

import { SAMPLE_MESSAGES, analyzeConversation } from '@missed/engine';

// 1. Application State
let currentMessages = SAMPLE_MESSAGES;
let currentChatTitle = 'Payment Gateway Incident (Sample)';
let isSampleMode = true;
let completedTasks = new Set();
let activeTab = 'overview';
let activeAnalysis = analyzeConversation(currentMessages);

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
const sampleBtn = document.getElementById('sampleBtn');
const refreshBtn = document.getElementById('refreshBtn');
const copySummaryBtn = document.getElementById('copySummaryBtn');

// 3. Render Functions
function showNotice(text, type = 'error') {
  noticeBanner.textContent = text;
  noticeBanner.className = `notice-banner ${type}`;
}

function clearNotice() {
  noticeBanner.className = 'notice-banner hidden';
  noticeBanner.textContent = '';
}

function renderUI() {
  // Header & Counters
  convTitleEl.textContent = currentChatTitle;
  msgCountEl.textContent = `${currentMessages.length} messages`;
  convSourceEl.textContent = isSampleMode ? 'Sample Demo' : 'WhatsApp Live';

  urgentCountEl.textContent = activeAnalysis.stats.urgentCount;
  tasksCountEl.textContent = activeAnalysis.stats.actionItemCount - completedTasks.size;
  decisionsCountEl.textContent = activeAnalysis.stats.decisionCount;

  tabTaskCountEl.textContent = activeAnalysis.stats.actionItemCount;
  tabImportantCountEl.textContent = activeAnalysis.stats.urgentCount + activeAnalysis.stats.decisionCount;

  // Overview View
  const recapBulletsEl = document.getElementById('recapBullets');
  recapBulletsEl.innerHTML = activeAnalysis.recap.summaryBullets.map((b) => `<li>• ${b}</li>`).join('');

  // Overview: Urgent
  const overviewUrgentEl = document.getElementById('overviewUrgent');
  const urgentItems = activeAnalysis.findings.filter((f) => f.category === 'urgent');
  if (urgentItems.length === 0) {
    overviewUrgentEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No urgent issues detected.</div>';
  } else {
    overviewUrgentEl.innerHTML = urgentItems.slice(0, 3).map(renderFindingCard).join('');
  }

  // Overview: Decisions
  const overviewDecisionsEl = document.getElementById('overviewDecisions');
  const decisionItems = activeAnalysis.findings.filter((f) => f.category === 'decision' || f.category === 'deadline');
  if (decisionItems.length === 0) {
    overviewDecisionsEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No decisions or deadlines detected.</div>';
  } else {
    overviewDecisionsEl.innerHTML = decisionItems.slice(0, 3).map(renderFindingCard).join('');
  }

  // Overview: Tasks
  const overviewTasksEl = document.getElementById('overviewTasks');
  const taskItems = activeAnalysis.findings.filter((f) => f.category === 'action_item');
  if (taskItems.length === 0) {
    overviewTasksEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No action items detected.</div>';
  } else {
    overviewTasksEl.innerHTML = taskItems.slice(0, 3).map(renderTaskCard).join('');
  }

  // Tasks View
  const tasksListEl = document.getElementById('tasksList');
  if (taskItems.length === 0) {
    tasksListEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No tasks found in conversation.</div>';
  } else {
    tasksListEl.innerHTML = taskItems.map(renderTaskCard).join('');
  }

  // Important View
  const importantListEl = document.getElementById('importantList');
  const importantItems = activeAnalysis.findings.filter((f) => f.category !== 'action_item');
  if (importantItems.length === 0) {
    importantListEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No important items found.</div>';
  } else {
    importantListEl.innerHTML = importantItems.map(renderFindingCard).join('');
  }

  attachInteractiveHandlers();
}

function renderFindingCard(finding) {
  return `
    <div class="finding-card ${finding.category === 'urgent' ? 'urgent' : ''}">
      <div class="card-header">
        <span class="badge ${finding.category}">${finding.category}</span>
        <button class="source-link-btn" data-snippet="${encodeURIComponent(finding.snippet)}">Source →</button>
      </div>
      <div class="finding-title">${finding.title}</div>
      <div class="finding-snippet">"${finding.snippet}"</div>
      <div style="font-size:10px;color:#64748b;">${finding.sender} • ${finding.timestamp || 'No time'}</div>
    </div>
  `;
}

function renderTaskCard(task) {
  const isDone = completedTasks.has(task.id);
  return `
    <div class="finding-card task-item ${isDone ? 'completed' : ''}">
      <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isDone ? 'checked' : ''}>
      <div style="flex:1;">
        <div class="card-header">
          <span class="badge action">${task.assignee ? '@' + task.assignee : 'Task'}</span>
          <button class="source-link-btn" data-snippet="${encodeURIComponent(task.snippet)}">Source →</button>
        </div>
        <div class="finding-snippet">"${task.snippet}"</div>
        <div style="font-size:10px;color:#64748b;">${task.sender} • ${task.timestamp || 'No time'}</div>
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

  // Source jump
  document.querySelectorAll('.source-link-btn').forEach((btn) => {
    btn.onclick = async (e) => {
      const snippet = decodeURIComponent(e.target.getAttribute('data-snippet'));
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_SOURCE_MESSAGE', snippet }).catch(() => {});
        }
      }
    };
  });
}

// 4. Navigation Tabs
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

// Counter card shortcuts to tabs
document.querySelectorAll('.counter-card').forEach((card) => {
  card.onclick = () => {
    const targetTab = card.getAttribute('data-tab');
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    if (tabBtn) tabBtn.click();
  };
});

// 5. Core WhatsApp Live Scrape Flow
async function triggerWhatsAppScrape() {
  clearNotice();
  catchBtnText.textContent = 'Scanning...';
  catchMeUpBtn.disabled = true;

  if (typeof chrome === 'undefined' || !chrome.tabs) {
    showNotice('Extension API unavailable in standalone browser. Loaded demo conversation instead.', 'info');
    loadSampleData();
    catchBtnText.textContent = 'Catch me up';
    catchMeUpBtn.disabled = false;
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      showNotice('No active browser tab found.', 'error');
      catchBtnText.textContent = 'Catch me up';
      catchMeUpBtn.disabled = false;
      return;
    }

    if (!tab.url || !tab.url.includes('web.whatsapp.com')) {
      showNotice('Active tab is not WhatsApp Web. Open web.whatsapp.com or click "Load Demo".', 'error');
      catchBtnText.textContent = 'Catch me up';
      catchMeUpBtn.disabled = false;
      return;
    }

    // Send scrape command to WhatsApp Web content script
    chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_WHATSAPP_CHAT' }, (response) => {
      catchBtnText.textContent = 'Catch me up';
      catchMeUpBtn.disabled = false;

      if (chrome.runtime.lastError || !response) {
        showNotice('Could not connect to WhatsApp Web. Please refresh web.whatsapp.com and try again.', 'error');
        return;
      }

      if (!response.success) {
        showNotice(response.error || 'Failed to read messages from WhatsApp Web.', 'error');
        return;
      }

      // Success: process live messages
      currentMessages = response.messages;
      currentChatTitle = response.chatTitle || 'Active WhatsApp Chat';
      isSampleMode = false;
      completedTasks.clear();
      activeAnalysis = analyzeConversation(currentMessages);
      showNotice(`Successfully analyzed ${currentMessages.length} messages from "${currentChatTitle}".`, 'info');
      setTimeout(clearNotice, 4000);
      renderUI();
    });
  } catch (err) {
    catchBtnText.textContent = 'Catch me up';
    catchMeUpBtn.disabled = false;
    showNotice(`Error: ${err.message}`, 'error');
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

// 6. Event Listeners
catchMeUpBtn.onclick = triggerWhatsAppScrape;
refreshBtn.onclick = triggerWhatsAppScrape;
sampleBtn.onclick = loadSampleData;

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

// Initial Render on Open
renderUI();

