// Missed. — Extension Side Panel Bundle (Generated from extension/sidepanel.entry.js + @missed/engine via esbuild)
(() => {
  // packages/engine/src/parsers/index.ts
  var MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

  // packages/engine/src/heuristics/detectors.ts
  var URGENT_REGEX = /\b(critical|urgent|blocker|p0|outage|incident|emergency|fatal|fatal error|500 internal server error|asap)\b/i;
  function detectUrgency(msg) {
    const match = msg.text.match(URGENT_REGEX);
    if (!match) return null;
    const keyword = match[1].toUpperCase();
    return {
      id: `finding-urg-${msg.id}`,
      sourceMessageId: msg.id,
      category: "urgent",
      urgency: "high",
      title: `${keyword} Issue Reported`,
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      relevanceScore: 95,
      analyzer: "deterministic"
    };
  }
  var DECISION_REGEX = /\b(decision\s*:|we agreed|agreed to|we approved|approved\b|let'?s proceed with|let'?s go with|final call\s*:|we will delay|we will postpone|we will roll back|consensus\s*:)/i;
  function detectDecision(msg) {
    const match = msg.text.match(DECISION_REGEX);
    if (!match) return null;
    return {
      id: `finding-dec-${msg.id}`,
      sourceMessageId: msg.id,
      category: "decision",
      urgency: "high",
      title: "Key Decision Reached",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      relevanceScore: 85,
      analyzer: "deterministic"
    };
  }
  var DEADLINE_REGEX = /\b(deadline\s*(?:for|is)?|before\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)|by\s+eod|before\s+eod|due\s+(?:on|by)|until\s+\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
  var EXTRACT_DUE_REGEX = /(?:by|before|until|deadline(?:\s+is)?|\bis\b|\bdue\b|\bat\b)\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)|eod|tomorrow|friday|monday|today)/i;
  function detectDeadline(msg) {
    const match = msg.text.match(DEADLINE_REGEX);
    if (!match) return null;
    const dueMatch = msg.text.match(EXTRACT_DUE_REGEX);
    const dueDate = dueMatch ? dueMatch[1].toUpperCase() : void 0;
    return {
      id: `finding-dl-${msg.id}`,
      sourceMessageId: msg.id,
      category: "deadline",
      urgency: "high",
      title: dueDate ? `Deadline: ${dueDate}` : "Target Deadline Identified",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      dueDate,
      relevanceScore: 80,
      analyzer: "deterministic"
    };
  }
  var ACTION_REGEX = /\b(action\s*item(?:\s*(?:for|:))?|todo\s*:|please\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|halt)|i\s*will\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|look|increase)|i'?ll\s+(?:deploy|check|verify|run|fix|investigate|prepare|post|restart|update|handle)|assigned\s+to|assigning\s+to|need\s+someone\s+to)\b/i;
  var ASSIGNEE_NAME_REGEX = /(?:action\s*item\s*for|action\s*item\s*:?\s*@?|@)\s*([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/i;
  function detectActionItem(msg) {
    const match = msg.text.match(ACTION_REGEX);
    if (!match) return null;
    let assignee;
    if (/\bi\s*will\b|\bi'?ll\b/i.test(msg.text)) {
      assignee = msg.sender;
    } else {
      const assigneeMatch = msg.text.match(ASSIGNEE_NAME_REGEX);
      if (assigneeMatch && assigneeMatch[1]) {
        assignee = assigneeMatch[1].trim();
      }
    }
    const hasUrgencyOrDeadline = URGENT_REGEX.test(msg.text) || DEADLINE_REGEX.test(msg.text);
    return {
      id: `finding-act-${msg.id}`,
      sourceMessageId: msg.id,
      category: "action_item",
      urgency: hasUrgencyOrDeadline ? "high" : "medium",
      title: assignee ? `Task assigned to ${assignee}` : "Action Item Identified",
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      assignee,
      relevanceScore: 75,
      analyzer: "deterministic"
    };
  }
  var MENTION_REGEX = /@([A-Za-z0-9_]+(?:\s+[A-Za-z0-9_]+)?)/;
  function detectMention(msg) {
    const match = msg.text.match(MENTION_REGEX);
    if (!match) return null;
    const target = match[1].trim();
    const isQuestion = msg.text.includes("?");
    return {
      id: `finding-men-${msg.id}`,
      sourceMessageId: msg.id,
      category: "mention",
      urgency: isQuestion ? "medium" : "low",
      title: isQuestion ? `Direct question to @${target}` : `Direct mention of @${target}`,
      snippet: msg.text,
      sender: msg.sender,
      timestamp: msg.timestamp,
      assignee: target,
      relevanceScore: 65,
      analyzer: "deterministic"
    };
  }

  // packages/engine/src/heuristics/recapGenerator.ts
  var STOP_WORDS = /* @__PURE__ */ new Set([
    "the",
    "be",
    "to",
    "of",
    "and",
    "a",
    "in",
    "that",
    "have",
    "i",
    "it",
    "for",
    "not",
    "on",
    "with",
    "he",
    "as",
    "you",
    "do",
    "at",
    "this",
    "but",
    "his",
    "by",
    "from",
    "they",
    "we",
    "say",
    "her",
    "she",
    "or",
    "an",
    "will",
    "my",
    "one",
    "all",
    "would",
    "there",
    "their",
    "what",
    "so",
    "up",
    "out",
    "if",
    "about",
    "who",
    "get",
    "which",
    "go",
    "me",
    "when",
    "make",
    "can",
    "like",
    "time",
    "no",
    "just",
    "him",
    "know",
    "take",
    "people",
    "into",
    "year",
    "your",
    "good",
    "some",
    "could",
    "them",
    "see",
    "other",
    "than",
    "then",
    "now",
    "look",
    "only",
    "come",
    "its",
    "over",
    "think",
    "also",
    "back",
    "after",
    "use",
    "two",
    "how",
    "our",
    "work",
    "first",
    "well",
    "way",
    "even",
    "new",
    "want",
    "because",
    "any",
    "these",
    "give",
    "day",
    "most",
    "us",
    "is",
    "are",
    "was",
    "were",
    "am",
    "been",
    "has",
    "had",
    "doing",
    "does",
    "did",
    "please",
    "team",
    "everyone",
    "hello",
    "morning",
    "again",
    "still",
    "right"
  ]);
  function generateRecap(messages, findings) {
    const totalMessages = messages.length;
    if (totalMessages === 0) {
      return {
        totalMessages: 0,
        participantCount: 0,
        participants: [],
        topTopics: [],
        summaryBullets: ["No messages available to summarize."]
      };
    }
    const participantSet = /* @__PURE__ */ new Set();
    messages.forEach((m) => {
      if (m.sender && m.sender !== "Unknown") {
        participantSet.add(m.sender);
      }
    });
    const participants = Array.from(participantSet);
    const participantCount = participants.length;
    const timestamps = messages.map((m) => m.timestamp).filter((ts) => Boolean(ts));
    const startTime = timestamps.length > 0 ? timestamps[0] : void 0;
    const endTime = timestamps.length > 0 ? timestamps[timestamps.length - 1] : void 0;
    const wordCounts = /* @__PURE__ */ new Map();
    messages.forEach((msg) => {
      const words = msg.text.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/);
      words.forEach((w) => {
        if (w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
        }
      });
    });
    const topTopics = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    const summaryBullets = [];
    const timeStr = startTime && endTime ? ` from ${startTime.split(" ")[1] || startTime} to ${endTime.split(" ")[1] || endTime}` : "";
    summaryBullets.push(
      `Conversation contains ${totalMessages} messages across ${participantCount} participants${timeStr}.`
    );
    const urgentFindings = findings.filter((f) => f.category === "urgent");
    if (urgentFindings.length > 0) {
      summaryBullets.push(
        `⚠️ Identified ${urgentFindings.length} critical alert/blocker${urgentFindings.length > 1 ? "s" : ""} requiring immediate attention.`
      );
    } else {
      summaryBullets.push("✓ No critical blockers or P0 system alerts were raised.");
    }
    const decisionFindings = findings.filter((f) => f.category === "decision");
    if (decisionFindings.length > 0) {
      summaryBullets.push(
        `🎯 ${decisionFindings.length} formal decision${decisionFindings.length > 1 ? "s" : ""} reached (e.g., "${decisionFindings[0].snippet.slice(0, 75)}...").`
      );
    }
    const actionFindings = findings.filter((f) => f.category === "action_item");
    const deadlineFindings = findings.filter((f) => f.category === "deadline");
    if (actionFindings.length > 0 || deadlineFindings.length > 0) {
      summaryBullets.push(
        `📌 ${actionFindings.length} actionable task${actionFindings.length > 1 ? "s" : ""} and ${deadlineFindings.length} targeted deadline${deadlineFindings.length > 1 ? "s" : ""} assigned.`
      );
    }
    return {
      totalMessages,
      participantCount,
      participants,
      startTime,
      endTime,
      topTopics,
      summaryBullets
    };
  }

  // packages/engine/src/heuristics/analyzer.ts
  function analyzeConversation(messages) {
    const findings = [];
    for (const msg of messages) {
      const urgency = detectUrgency(msg);
      if (urgency) findings.push({ analyzer: "deterministic", ...urgency });
      const decision = detectDecision(msg);
      if (decision) findings.push({ analyzer: "deterministic", ...decision });
      const deadline = detectDeadline(msg);
      if (deadline) findings.push({ analyzer: "deterministic", ...deadline });
      const actionItem = detectActionItem(msg);
      if (actionItem) findings.push({ analyzer: "deterministic", ...actionItem });
      const mention = detectMention(msg);
      if (mention) findings.push({ analyzer: "deterministic", ...mention });
    }
    const priorityWeight = {
      high: 300,
      medium: 200,
      low: 100
    };
    findings.sort((a, b) => {
      const scoreA = priorityWeight[a.urgency] + a.relevanceScore;
      const scoreB = priorityWeight[b.urgency] + b.relevanceScore;
      return scoreB - scoreA;
    });
    const stats = {
      urgentCount: findings.filter((f) => f.category === "urgent").length,
      actionItemCount: findings.filter((f) => f.category === "action_item").length,
      decisionCount: findings.filter((f) => f.category === "decision").length,
      deadlinesCount: findings.filter((f) => f.category === "deadline").length,
      mentionsCount: findings.filter((f) => f.category === "mention").length
    };
    const recap = generateRecap(messages, findings);
    return {
      recap,
      findings,
      stats
    };
  }

  // packages/engine/src/sampleConversation.ts
  var SAMPLE_MESSAGES = [
    {
      id: "sample-01",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:15:22",
      text: "Good morning team. Starting the payment gateway migration cutover now.",
      raw: "[2026-10-09 09:15:22] Maya Lin: Good morning team. Starting the payment gateway migration cutover now.",
      lineIndex: 0
    },
    {
      id: "sample-02",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:17:40",
      text: "Infrastructure standby is green. Database replicas are synchronized.",
      raw: "[2026-10-09 09:17:40] Leo Chen: Infrastructure standby is green. Database replicas are synchronized.",
      lineIndex: 1
    },
    {
      id: "sample-03",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:21:05",
      text: "CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!",
      raw: "[2026-10-09 09:21:05] Maya Lin: CRITICAL: The staging payment gateway webhook is returning 500 Internal Server Error on card authorisations!",
      lineIndex: 2
    },
    {
      id: "sample-04",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:22:18",
      text: "Is production affected yet? We have 1,400 active shoppers right now.",
      raw: "[2026-10-09 09:22:18] Priya Sharma: Is production affected yet? We have 1,400 active shoppers right now.",
      lineIndex: 3
    },
    {
      id: "sample-05",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:23:45",
      text: "Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.",
      raw: "[2026-10-09 09:23:45] Leo Chen: Production traffic is still routing to legacy gateway v1. Staging cutover is isolated.",
      lineIndex: 4
    },
    {
      id: "sample-06",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:25:10",
      text: "BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.",
      raw: "[2026-10-09 09:25:10] Maya Lin: BLOCKER: Redis connection pool is exhausted on node-3 due to unclosed socket connections in the new SDK.",
      lineIndex: 5
    },
    {
      id: "sample-07",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:26:30",
      text: "@Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.",
      raw: "[2026-10-09 09:26:30] Leo Chen: @Maya Lin I am increasing the connection pool limit to 500 and restarting the proxy workers immediately.",
      lineIndex: 6
    },
    {
      id: "sample-08",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:29:15",
      text: "Can we proceed with today's 10:00 AM launch or do we need to postpone?",
      raw: "[2026-10-09 09:29:15] Priya Sharma: Can we proceed with today's 10:00 AM launch or do we need to postpone?",
      lineIndex: 7
    },
    {
      id: "sample-09",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:31:00",
      text: "Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.",
      raw: "[2026-10-09 09:31:00] Maya Lin: Decision: We approved delaying the production cutover to 3:00 PM today until the SDK socket leak is patched.",
      lineIndex: 8
    },
    {
      id: "sample-10",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:32:45",
      text: "Agreed. I will post an update to the customer executive dashboard before 10:00 AM.",
      raw: "[2026-10-09 09:32:45] Priya Sharma: Agreed. I will post an update to the customer executive dashboard before 10:00 AM.",
      lineIndex: 9
    },
    {
      id: "sample-11",
      sender: "Alex Rivera",
      timestamp: "2026-10-09 09:35:12",
      text: "Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.",
      raw: "[2026-10-09 09:35:12] Alex Rivera: Frontend checkout modal is currently displaying a generic error message. I will push a user-friendly retry banner.",
      lineIndex: 10
    },
    {
      id: "sample-12",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:37:04",
      text: "Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.",
      raw: "[2026-10-09 09:37:04] Maya Lin: Action item: @Alex Rivera please deploy the banner fix to staging by 10:30 AM.",
      lineIndex: 11
    },
    {
      id: "sample-13",
      sender: "Sam Thorne",
      timestamp: "2026-10-09 09:39:50",
      text: "QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.",
      raw: "[2026-10-09 09:39:50] Sam Thorne: QA is ready. Action item for Sam: Run full automated checkout regression suite once Leo restarts the workers.",
      lineIndex: 12
    },
    {
      id: "sample-14",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:42:15",
      text: "Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.",
      raw: "[2026-10-09 09:42:15] Leo Chen: Redis workers restarted. Memory usage stable at 38%. Socket leak is mitigated by the new connection pool timeout.",
      lineIndex: 13
    },
    {
      id: "sample-15",
      sender: "Sam Thorne",
      timestamp: "2026-10-09 09:44:00",
      text: "Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.",
      raw: "[2026-10-09 09:44:00] Sam Thorne: Beginning test execution now. Deadline for smoke test sign-off is 11:15 AM.",
      lineIndex: 14
    },
    {
      id: "sample-16",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:47:20",
      text: "Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.",
      raw: "[2026-10-09 09:47:20] Maya Lin: Decision: Staging traffic will remain on v2 SDK for soak testing until 2:00 PM.",
      lineIndex: 15
    },
    {
      id: "sample-17",
      sender: "Priya Sharma",
      timestamp: "2026-10-09 09:50:35",
      text: "@Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?",
      raw: "[2026-10-09 09:50:35] Priya Sharma: @Leo Chen can you confirm our rollback runbook is verified in case we encounter issues at 3:00 PM?",
      lineIndex: 16
    },
    {
      id: "sample-18",
      sender: "Leo Chen",
      timestamp: "2026-10-09 09:52:10",
      text: "Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.",
      raw: "[2026-10-09 09:52:10] Leo Chen: Yes, rollback script is tested. Action item: Leo to prepare automated rollback trigger before 1:00 PM.",
      lineIndex: 17
    },
    {
      id: "sample-19",
      sender: "Alex Rivera",
      timestamp: "2026-10-09 09:55:00",
      text: "Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.",
      raw: "[2026-10-09 09:55:00] Alex Rivera: Banner deployed to staging. @Sam Thorne please include the banner in your validation pass.",
      lineIndex: 18
    },
    {
      id: "sample-20",
      sender: "Maya Lin",
      timestamp: "2026-10-09 09:58:30",
      text: "Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.",
      raw: "[2026-10-09 09:58:30] Maya Lin: Excellent work under pressure everyone. Sync again at 1:30 PM for final go/no-go decision.",
      lineIndex: 19
    }
  ];

  // extension/sidepanel.entry.js
  var currentMessages = SAMPLE_MESSAGES;
  var currentChatTitle = "Payment Gateway Incident (Sample)";
  var isSampleMode = true;
  var completedTasks = /* @__PURE__ */ new Set();
  var activeTab = "overview";
  var activeAnalysis = analyzeConversation(currentMessages);
  var convTitleEl = document.getElementById("convTitle");
  var msgCountEl = document.getElementById("msgCount");
  var convSourceEl = document.getElementById("convSource");
  var urgentCountEl = document.getElementById("urgentCount");
  var tasksCountEl = document.getElementById("tasksCount");
  var decisionsCountEl = document.getElementById("decisionsCount");
  var tabTaskCountEl = document.getElementById("tabTaskCount");
  var tabImportantCountEl = document.getElementById("tabImportantCount");
  var noticeBanner = document.getElementById("noticeBanner");
  var catchMeUpBtn = document.getElementById("catchMeUpBtn");
  var catchBtnText = document.getElementById("catchBtnText");
  var sampleBtn = document.getElementById("sampleBtn");
  var refreshBtn = document.getElementById("refreshBtn");
  var copySummaryBtn = document.getElementById("copySummaryBtn");
  function showNotice(text, type = "error") {
    noticeBanner.textContent = text;
    noticeBanner.className = `notice-banner ${type}`;
  }
  function clearNotice() {
    noticeBanner.className = "notice-banner hidden";
    noticeBanner.textContent = "";
  }
  function renderUI() {
    convTitleEl.textContent = currentChatTitle;
    msgCountEl.textContent = `${currentMessages.length} messages`;
    convSourceEl.textContent = isSampleMode ? "Sample Demo" : "WhatsApp Live";
    urgentCountEl.textContent = activeAnalysis.stats.urgentCount;
    tasksCountEl.textContent = activeAnalysis.stats.actionItemCount - completedTasks.size;
    decisionsCountEl.textContent = activeAnalysis.stats.decisionCount;
    tabTaskCountEl.textContent = activeAnalysis.stats.actionItemCount;
    tabImportantCountEl.textContent = activeAnalysis.stats.urgentCount + activeAnalysis.stats.decisionCount;
    const recapBulletsEl = document.getElementById("recapBullets");
    recapBulletsEl.innerHTML = activeAnalysis.recap.summaryBullets.map((b) => `<li>• ${b}</li>`).join("");
    const overviewUrgentEl = document.getElementById("overviewUrgent");
    const urgentItems = activeAnalysis.findings.filter((f) => f.category === "urgent");
    if (urgentItems.length === 0) {
      overviewUrgentEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No urgent issues detected.</div>';
    } else {
      overviewUrgentEl.innerHTML = urgentItems.slice(0, 3).map(renderFindingCard).join("");
    }
    const overviewDecisionsEl = document.getElementById("overviewDecisions");
    const decisionItems = activeAnalysis.findings.filter((f) => f.category === "decision" || f.category === "deadline");
    if (decisionItems.length === 0) {
      overviewDecisionsEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No decisions or deadlines detected.</div>';
    } else {
      overviewDecisionsEl.innerHTML = decisionItems.slice(0, 3).map(renderFindingCard).join("");
    }
    const overviewTasksEl = document.getElementById("overviewTasks");
    const taskItems = activeAnalysis.findings.filter((f) => f.category === "action_item");
    if (taskItems.length === 0) {
      overviewTasksEl.innerHTML = '<div style="color:#64748b;font-size:11px;">No action items detected.</div>';
    } else {
      overviewTasksEl.innerHTML = taskItems.slice(0, 3).map(renderTaskCard).join("");
    }
    const tasksListEl = document.getElementById("tasksList");
    if (taskItems.length === 0) {
      tasksListEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No tasks found in conversation.</div>';
    } else {
      tasksListEl.innerHTML = taskItems.map(renderTaskCard).join("");
    }
    const importantListEl = document.getElementById("importantList");
    const importantItems = activeAnalysis.findings.filter((f) => f.category !== "action_item");
    if (importantItems.length === 0) {
      importantListEl.innerHTML = '<div style="text-align:center;padding:20px;color:#64748b;">No important items found.</div>';
    } else {
      importantListEl.innerHTML = importantItems.map(renderFindingCard).join("");
    }
    attachInteractiveHandlers();
  }
  function renderFindingCard(finding) {
    return `
    <div class="finding-card ${finding.category === "urgent" ? "urgent" : ""}">
      <div class="card-header">
        <span class="badge ${finding.category}">${finding.category}</span>
        <button class="source-link-btn" data-snippet="${encodeURIComponent(finding.snippet)}">Source →</button>
      </div>
      <div class="finding-title">${finding.title}</div>
      <div class="finding-snippet">"${finding.snippet}"</div>
      <div style="font-size:10px;color:#64748b;">${finding.sender} • ${finding.timestamp || "No time"}</div>
    </div>
  `;
  }
  function renderTaskCard(task) {
    const isDone = completedTasks.has(task.id);
    return `
    <div class="finding-card task-item ${isDone ? "completed" : ""}">
      <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isDone ? "checked" : ""}>
      <div style="flex:1;">
        <div class="card-header">
          <span class="badge action">${task.assignee ? "@" + task.assignee : "Task"}</span>
          <button class="source-link-btn" data-snippet="${encodeURIComponent(task.snippet)}">Source →</button>
        </div>
        <div class="finding-snippet">"${task.snippet}"</div>
        <div style="font-size:10px;color:#64748b;">${task.sender} • ${task.timestamp || "No time"}</div>
      </div>
    </div>
  `;
  }
  function attachInteractiveHandlers() {
    document.querySelectorAll(".task-checkbox").forEach((cb) => {
      cb.onchange = (e) => {
        const id = e.target.getAttribute("data-task-id");
        if (e.target.checked) completedTasks.add(id);
        else completedTasks.delete(id);
        renderUI();
      };
    });
    document.querySelectorAll(".source-link-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const snippet = decodeURIComponent(e.target.getAttribute("data-snippet"));
        if (typeof chrome !== "undefined" && chrome.tabs) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: "HIGHLIGHT_SOURCE_MESSAGE", snippet }).catch(() => {
            });
          }
        }
      };
    });
  }
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.onclick = (e) => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((p) => p.classList.remove("active"));
      const tab = e.target.getAttribute("data-tab");
      e.target.classList.add("active");
      document.getElementById(`${tab}View`).classList.add("active");
      activeTab = tab;
      void activeTab;
    };
  });
  document.querySelectorAll(".counter-card").forEach((card) => {
    card.onclick = () => {
      const targetTab = card.getAttribute("data-tab");
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
      if (tabBtn) tabBtn.click();
    };
  });
  async function triggerWhatsAppScrape() {
    clearNotice();
    catchBtnText.textContent = "Scanning...";
    catchMeUpBtn.disabled = true;
    if (typeof chrome === "undefined" || !chrome.tabs) {
      showNotice("Extension API unavailable in standalone browser. Loaded demo conversation instead.", "info");
      loadSampleData();
      catchBtnText.textContent = "Catch me up";
      catchMeUpBtn.disabled = false;
      return;
    }
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        showNotice("No active browser tab found.", "error");
        catchBtnText.textContent = "Catch me up";
        catchMeUpBtn.disabled = false;
        return;
      }
      if (!tab.url || !tab.url.includes("web.whatsapp.com")) {
        showNotice('Active tab is not WhatsApp Web. Open web.whatsapp.com or click "Load Demo".', "error");
        catchBtnText.textContent = "Catch me up";
        catchMeUpBtn.disabled = false;
        return;
      }
      chrome.tabs.sendMessage(tab.id, { type: "SCRAPE_WHATSAPP_CHAT" }, (response) => {
        catchBtnText.textContent = "Catch me up";
        catchMeUpBtn.disabled = false;
        if (chrome.runtime.lastError || !response) {
          showNotice("Could not connect to WhatsApp Web. Please refresh web.whatsapp.com and try again.", "error");
          return;
        }
        if (!response.success) {
          showNotice(response.error || "Failed to read messages from WhatsApp Web.", "error");
          return;
        }
        currentMessages = response.messages;
        currentChatTitle = response.chatTitle || "Active WhatsApp Chat";
        isSampleMode = false;
        completedTasks.clear();
        activeAnalysis = analyzeConversation(currentMessages);
        showNotice(`Successfully analyzed ${currentMessages.length} messages from "${currentChatTitle}".`, "info");
        setTimeout(clearNotice, 4e3);
        renderUI();
      });
    } catch (err) {
      catchBtnText.textContent = "Catch me up";
      catchMeUpBtn.disabled = false;
      showNotice(`Error: ${err.message}`, "error");
    }
  }
  function loadSampleData() {
    currentMessages = SAMPLE_MESSAGES;
    currentChatTitle = "Payment Gateway Incident (Sample)";
    isSampleMode = true;
    completedTasks.clear();
    activeAnalysis = analyzeConversation(currentMessages);
    clearNotice();
    renderUI();
  }
  catchMeUpBtn.onclick = triggerWhatsAppScrape;
  refreshBtn.onclick = triggerWhatsAppScrape;
  sampleBtn.onclick = loadSampleData;
  copySummaryBtn.onclick = async () => {
    let text = `# Catch-Up Summary: ${currentChatTitle}

`;
    activeAnalysis.recap.summaryBullets.forEach((b) => text += `- ${b}
`);
    text += `
## Tasks
`;
    activeAnalysis.findings.filter((f) => f.category === "action_item").forEach((t) => {
      text += `- [${completedTasks.has(t.id) ? "x" : " "}] ${t.snippet}
`;
    });
    await navigator.clipboard.writeText(text);
    copySummaryBtn.textContent = "Copied!";
    setTimeout(() => copySummaryBtn.textContent = "Copy Summary", 2e3);
  };
  renderUI();
})();
