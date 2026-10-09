// Missed. — Extension Side Panel Logic
// 100% on-device heuristic catch-up companion for WhatsApp Web

// 1. Built-in Sample Dataset
const SAMPLE_MESSAGES = [
  { id: 'sample-01', sender: 'Maya Lin', timestamp: '09:15:22', text: 'Good morning team. Starting payment gateway migration cutover now.' },
  { id: 'sample-02', sender: 'Leo Chen', timestamp: '09:17:40', text: 'Infrastructure standby is green. Database replicas synchronized.' },
  { id: 'sample-03', sender: 'Maya Lin', timestamp: '09:21:05', text: 'CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on authorisations!' },
  { id: 'sample-04', sender: 'Priya Sharma', timestamp: '09:22:18', text: 'Is production affected yet? We have 1,400 active shoppers right now.' },
  { id: 'sample-05', sender: 'Leo Chen', timestamp: '09:23:45', text: 'Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.' },
  { id: 'sample-06', sender: 'Maya Lin', timestamp: '09:25:10', text: 'BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections.' },
  { id: 'sample-07', sender: 'Leo Chen', timestamp: '09:26:30', text: '@Maya Lin I am increasing the connection pool limit to 500 and restarting proxy workers.' },
  { id: 'sample-08', sender: 'Priya Sharma', timestamp: '09:29:15', text: 'Can we proceed with today 10:00 AM launch or do we need to postpone?' },
  { id: 'sample-09', sender: 'Maya Lin', timestamp: '09:31:00', text: 'Decision: We approved delaying the production cutover to 3:00 PM today.' },
  { id: 'sample-10', sender: 'Priya Sharma', timestamp: '09:32:45', text: 'Agreed. I will post an update to the customer dashboard before 10:00 AM.' },
  { id: 'sample-11', sender: 'Alex Rivera', timestamp: '09:35:12', text: 'Frontend checkout modal is displaying a generic error. I will push a retry banner.' },
  { id: 'sample-12', sender: 'Maya Lin', timestamp: '09:37:04', text: 'Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.' },
  { id: 'sample-13', sender: 'Sam Thorne', timestamp: '09:39:50', text: 'QA is ready. Action item for Sam: Run full checkout regression suite once workers restart.' },
  { id: 'sample-14', sender: 'Leo Chen', timestamp: '09:42:15', text: 'Redis workers restarted. Memory usage stable at 38%.' },
  { id: 'sample-15', sender: 'Sam Thorne', timestamp: '09:44:00', text: 'Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.' },
  { id: 'sample-16', sender: 'Maya Lin', timestamp: '09:47:20', text: 'Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.' },
  { id: 'sample-17', sender: 'Priya Sharma', timestamp: '09:50:35', text: '@Leo Chen can you confirm our rollback runbook is verified in case of issues at 3:00 PM?' },
  { id: 'sample-18', sender: 'Leo Chen', timestamp: '09:52:10', text: 'Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.' },
  { id: 'sample-19', sender: 'Alex Rivera', timestamp: '09:55:00', text: 'Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.' },
  { id: 'sample-20', sender: 'Maya Lin', timestamp: '09:58:30', text: 'Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.' },
];

// 2. Deterministic Heuristic Engine
const URGENT_REGEX = /\b(critical|urgent|blocker|p0|outage|incident|emergency|fatal|500 internal server error|asap)\b/i;
const DECISION_REGEX = /\b(decision\s*:|we agreed|agreed to|we approved|approved\b|let'?s proceed with|let'?s go with|final call\s*:|we will delay|we will postpone|we will roll back|consensus\s*:)/i;
const DEADLINE_REGEX = /\b(deadline\s*(?:for|is)?|before\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+eod|before\s+eod|due\s+(?:on|by)|until\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
const EXTRACT_DUE_REGEX = /(?:by|before|until|deadline(?:\s+is)?|\bis\b|\bdue\b|\bat\b)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)|eod|tomorrow|friday|monday|today)/i;
const ACTION_REGEX = /\b(action\s*item(?:\s*(?:for|:))?|todo\s*:|please\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|halt)|i\s*will\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|look|increase)|i'?ll\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|handle)|assigned\s+to|assigning\s+to|need\s+someone\s+to)\b/i;
const ASSIGNEE_REGEX = /(?:action\s*item\s*for|action\s*item\s*:?\s*@?|@)\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/i;
const MENTION_REGEX = /@([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/;

function analyzeConversation(messages) {
  const findings = [];

  messages.forEach((msg) => {
    // Urgency
    const urgMatch = msg.text.match(URGENT_REGEX);
    if (urgMatch) {
      findings.push({
        id: `urg-${msg.id}`,
        sourceId: msg.id,
        category: 'urgent',
        urgency: 'high',
        title: `${urgMatch[1].toUpperCase()} Issue Reported`,
        snippet: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        relevanceScore: 95,
      });
    }

    // Decision
    if (DECISION_REGEX.test(msg.text)) {
      findings.push({
        id: `dec-${msg.id}`,
        sourceId: msg.id,
        category: 'decision',
        urgency: 'high',
        title: 'Key Decision Reached',
        snippet: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        relevanceScore: 85,
      });
    }

    // Deadline
    if (DEADLINE_REGEX.test(msg.text)) {
      const dueMatch = msg.text.match(EXTRACT_DUE_REGEX);
      const dueDate = dueMatch ? dueMatch[1].toUpperCase() : undefined;
      findings.push({
        id: `dl-${msg.id}`,
        sourceId: msg.id,
        category: 'deadline',
        urgency: 'high',
        title: dueDate ? `Deadline: ${dueDate}` : 'Target Deadline Identified',
        snippet: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        dueDate,
        relevanceScore: 80,
      });
    }

    // Action Item
    if (ACTION_REGEX.test(msg.text)) {
      let assignee = undefined;
      if (/\bi\s*will\b|\bi'?ll\b/i.test(msg.text)) {
        assignee = msg.sender;
      } else {
        const m = msg.text.match(ASSIGNEE_REGEX);
        if (m) assignee = m[1].trim();
      }
      findings.push({
        id: `act-${msg.id}`,
        sourceId: msg.id,
        category: 'action_item',
        urgency: 'medium',
        title: assignee ? `Task: @${assignee}` : 'Action Item',
        snippet: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        assignee,
        relevanceScore: 75,
      });
    }

    // Mention
    const menMatch = msg.text.match(MENTION_REGEX);
    if (menMatch) {
      findings.push({
        id: `men-${msg.id}`,
        sourceId: msg.id,
        category: 'mention',
        urgency: 'low',
        title: `Mention of @${menMatch[1].trim()}`,
        snippet: msg.text,
        sender: msg.sender,
        timestamp: msg.timestamp,
        assignee: menMatch[1].trim(),
        relevanceScore: 65,
      });
    }
  });

  // Sort by urgency/priority
  const priorityWeight = { high: 300, medium: 200, low: 100 };
  findings.sort((a, b) => (priorityWeight[b.urgency] + b.relevanceScore) - (priorityWeight[a.urgency] + a.relevanceScore));

  const stats = {
    urgentCount: findings.filter((f) => f.category === 'urgent').length,
    actionItemCount: findings.filter((f) => f.category === 'action_item').length,
    decisionCount: findings.filter((f) => f.category === 'decision').length,
    deadlinesCount: findings.filter((f) => f.category === 'deadline').length,
  };

  // Generate Recap Bullets
  const participants = Array.from(new Set(messages.map((m) => m.sender).filter(Boolean)));
  const summaryBullets = [];
  summaryBullets.push(`Analyzed ${messages.length} messages across ${participants.length} participants.`);

  if (stats.urgentCount > 0) {
    summaryBullets.push(`⚠️ ${stats.urgentCount} critical alert/blocker requires attention.`);
  } else {
    summaryBullets.push(`✓ No critical blockers or P0 system alerts reported.`);
  }

  if (stats.decisionCount > 0) {
    summaryBullets.push(`🎯 ${stats.decisionCount} key decisions recorded.`);
  }

  if (stats.actionItemCount > 0) {
    summaryBullets.push(`📌 ${stats.actionItemCount} tasks and action items assigned.`);
  }

  return { findings, stats, recap: { summaryBullets, participants } };
}

// 3. Application State
let currentMessages = SAMPLE_MESSAGES;
let currentChatTitle = 'Payment Gateway Incident (Sample)';
let isSampleMode = true;
let completedTasks = new Set();
let activeTab = 'overview';
let activeAnalysis = analyzeConversation(currentMessages);

// 4. DOM Elements
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

// 5. Render Functions
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

// 6. Navigation Tabs
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.onclick = (e) => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.view-panel').forEach((p) => p.classList.remove('active'));

    const tab = e.target.getAttribute('data-tab');
    e.target.classList.add('active');
    document.getElementById(`${tab}View`).classList.add('active');
    activeTab = tab;
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

// 7. Core WhatsApp Live Scrape Flow
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

// 8. Event Listeners
catchMeUpBtn.onclick = triggerWhatsAppScrape;
refreshBtn.onclick = triggerWhatsAppScrape;
sampleBtn.onclick = loadSampleData;

copySummaryBtn.onclick = async () => {
  let text = `# Catch-Up Summary: ${currentChatTitle}\n\n`;
  activeAnalysis.recap.summaryBullets.forEach((b) => text += `- ${b}\n`);
  text += `\n## Tasks\n`;
  activeAnalysis.findings.filter((f) => f.category === 'action_item').forEach((t) => {
    text += `- [${completedTasks.has(t.id) ? 'x' : ' '}] ${t.snippet}\n`;
  });
  await navigator.clipboard.writeText(text);
  copySummaryBtn.textContent = 'Copied!';
  setTimeout(() => copySummaryBtn.textContent = 'Copy Summary', 2000);
};

// Initial Render on Open
renderUI();

