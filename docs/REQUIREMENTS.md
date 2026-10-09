# REQUIREMENTS — What Did I Miss?

## 1. Problem Statement

### The Challenge: "The Unread Problem"
When team members return from meetings, leaves, or deep-focus sessions, they routinely face hundreds of unread messages across communication channels (Slack, WhatsApp, Microsoft Teams, Discord).

### Core Pain Points
1. **Information Overload:** Scanning long, unstructured chat threads sequentially is mentally taxing and time-consuming.
2. **Lost Critical Signals:** Crucial decisions, blockers, urgent alerts, assigned action items, and hard deadlines get buried in social banter and tangential debates.
3. **Context Disconnect:** Generic summaries often strip away context; when a user spots an important finding, finding where and why it was said in the original conversation is tedious.
4. **Data Privacy Concerns:** Users and enterprises are rightfully reluctant to paste sensitive proprietary conversations into external cloud LLMs or third-party servers.

### Solution Overview
**"What Did I Miss?"** is a fast, 100% on-device catch-up dashboard built for short hackathon execution. It imports conversation exports (`.txt` and `.json`) or loads a built-in realistic sample dataset with one click, parses messages into a standardized format, extracts critical findings (Decisions, Action Items, Deadlines, Urgent Alerts, Mentions) via transparent rule-based heuristics, scores findings by urgency and relevance, and deep-links every finding directly to its exact message in the transcript timeline.

---

## 2. Priority Classification (P0 / P1 / P2)

### P0 — Must Have (Core MVP — Demo-Ready in < 2 Hours)
- [ ] **P0-1: Built-in Realistic Sample Conversation**
  - Instant one-click "Load Sample Conversation" button on the hero/empty state and header.
  - Pre-loaded realistic workplace scenario (e.g., "Project Alpha Launch Incident & Cutover") containing 15–25 messages with explicit decisions, action items, tight deadlines, blocker warnings, and mentions.
  - Ensures a working demo even without external test files.
- [ ] **P0-2: Local File Import (.txt & .json)**
  - Drag-and-drop zone and standard native file picker.
  - Support for local JSON and TXT exports without network uploads.
- [ ] **P0-3: Resilient Parsing & Normalization Engine**
  - Parses incoming data into a uniform `ParsedMessage` internal schema (`id`, `sender`, `timestamp`, `text`, `raw`, `lineIndex`).
  - Resilient to missing timestamps, irregular line breaks, and multi-line message bodies.
- [ ] **P0-4: Rule-Based Heuristic Analysis Engine**
  - Extracts **Action Items** (imperatives, assignments, TODOs, commitments).
  - Extracts **Key Decisions** (consensus markers, approvals, agreed choices).
  - Extracts **Deadlines & Dates** (temporal markers, EOD, specific dates/times).
  - Extracts **Urgent & Important Messages** (blockers, critical outages, P0 markers, ASAP).
  - Extracts **Mentions & Direct Addresses** (`@username` tags and participant callouts).
  - Generates an **Executive Conversation Recap** (message count, time window, active participants, top topic keywords).
- [ ] **P0-5: Urgency & Relevance Scoring**
  - Deterministic priority scoring (`High`, `Medium`, `Low`) based on urgency keywords, mentions, and actionability.
- [ ] **P0-6: Source Message Deep Linking**
  - Every extracted finding card contains a link/anchor to its source message.
  - Clicking a finding automatically scrolls the transcript viewer to the source message and highlights it with a temporary visual glow/pulse.
- [ ] **P0-7: Clear, Polished Dashboard UI**
  - High-contrast, responsive layout with summary metric cards, tabbed/categorized findings, and an interactive chronological transcript pane.
- [ ] **P0-8: Graceful Error & Edge Case Handling**
  - Non-crashing visual alerts for malformed JSON, empty files, or unparseable TXT lines.
- [ ] **P0-9: Strict On-Device Privacy Boundary**
  - All processing happens 100% client-side via JavaScript. Zero external API calls, zero telemetry, zero remote storage.
- [ ] **P0-10: Transparent Heuristic Attribution**
  - Honest UI labeling clearly stating findings are derived from **"Deterministic Rule-Based Heuristics"** rather than claiming true generative AI inference.

### P1 — Important (Hackathon Polish & Edge — Target 2h45m)
- [ ] **P1-1: Real-Time Keyword Search & Filtering**
  - Real-time text search across findings and transcript messages with instant highlight.
- [ ] **P1-2: Category Filtering Tabs**
  - Quick filter chips/tabs: `All`, `Urgent`, `Action Items`, `Decisions`, `Deadlines`, `Mentions`.
- [ ] **P1-3: Participant / Sender Filter**
  - Dropdown filter to view only messages and findings originating from or mentioning a specific person.
- [ ] **P1-4: "What Did I Miss for Me?" Personalized Filter**
  - User can type their name or handle to instantly surface tasks assigned to them, questions directed at them, and their direct `@mentions`.
- [ ] **P1-5: Export Recap to Markdown / Clipboard**
  - One-click copy formatted executive summary and action items to clipboard for pasting into Slack/Notes.
- [ ] **P1-6: Format Auto-Detection**
  - Automatically identifies whether an uploaded file is Slack JSON, WhatsApp TXT, or generic transcript format.
- [ ] **P1-7: Session Reset / Clear Data**
  - Simple button to clear parsed state and return to initial import screen.

### P2 — Optional / Nice-to-Have (Stretch Goals)
- [ ] **P2-1: Timeline & Participant Activity Visualizations**
  - Lightweight chart showing message volume over time and top contributors using Recharts.
- [ ] **P2-2: Custom Heuristic Rule Configuration**
  - Simple settings modal allowing users to add custom keywords for urgency or action items.
- [ ] **P2-3: Multi-Conversation Tab Switching**
  - Compare or switch between multiple uploaded conversation channels in a single session.
- [ ] **P2-4: Optional Hybrid Mode (Bring-Your-Own-Key LLM)**
  - Opt-in toggle to call a local WebLLM or remote LLM (Gemini/OpenAI) if the user provides an API key, clearly warning about privacy tradeoffs.

---

## 3. Supported Import Formats & Specifications

The application accepts local files via drag-and-drop or file upload. Supported formats:

### 3.1. JSON Formats

#### Format A: Array of Message Objects (Standard Export)
```json
[
  {
    "id": "msg-001",
    "sender": "Maya Lin",
    "timestamp": "2026-10-09T09:15:00Z",
    "text": "CRITICAL: The production database migration stalled at table 4."
  },
  {
    "id": "msg-002",
    "sender": "Leo Chen",
    "timestamp": "2026-10-09T09:17:30Z",
    "text": "I am looking into it now. @Maya, please halt incoming traffic."
  }
]
```

#### Format B: Object with Messages Array
```json
{
  "channel": "deployments-war-room",
  "topic": "v2.4 Release Cutover",
  "messages": [
    {
      "user": "Alex Rivera",
      "timestamp": "2026-10-09T09:20:00Z",
      "content": "Decision: We are rolling back to v2.3 until the migration is patched."
    }
  ]
}
```

#### Format C: Slack Export JSON Format
- Array of objects containing `ts` (Unix epoch timestamp or string), `user` or `user_profile.real_name`, and `text`.
- Supported key aliases:
  - **Sender**: `sender`, `user`, `author`, `from`, `name`, `username`, `user_profile.real_name`
  - **Text**: `text`, `message`, `content`, `body`
  - **Timestamp**: `timestamp`, `time`, `ts`, `date`, `datetime`
  - **ID**: `id`, `client_msg_id`, `ts` (or auto-generated if missing)

### 3.2. TXT Formats

#### Format A: Bracketed Timestamp with Sender Prefix
```text
[2026-10-09 09:15:00] Maya Lin: CRITICAL: Production DB migration stalled at table 4.
[2026-10-09 09:17:30] Leo Chen: @Maya I will investigate the connection pool immediately.
[2026-10-09 09:20:00] Alex Rivera: Decision: We approved delaying the release by 2 hours.
```

#### Format B: WhatsApp / Mobile Export Format
```text
10/09/26, 09:15 AM - Maya Lin: Critical issue with the staging deployment.
10/09/26, 09:18 AM - Leo Chen: Working on fix. Action item for Sam: verify test cases by 11 AM.
```
*Also supports format with square brackets: `[10/09/2026, 9:15:00 AM] Maya Lin: message`*

#### Format C: Simple Sender-Colon Format (Timestamps Absent)
```text
Maya Lin: Blocker: The payment gateway webhook is returning 500 errors.
Leo Chen: I will roll back the config before 12:00 PM.
Alex Rivera: Agreed. Let us stick with standard rollback procedure.
```

#### Multi-line Message Handling
Lines not matching a new message header pattern (`[timestamp] sender:`, `date, time - sender:`, or `sender:`) are automatically treated as continuation lines and concatenated to the preceding message.

---

## 4. Limitations & Boundary Conditions

1. **Rule-Based vs. Generative NLP:** The MVP uses deterministic regular expressions, keyword lexicons, and structural pattern matching. It does not perform semantic abstraction or complex multi-turn reasoning that a 70B+ parameter generative LLM would perform.
2. **File Size Capacity:** Designed for conversation exports up to ~5 MB or approximately 10,000 messages. Parsing is synchronous in the main thread (or wrapped in simple microtasks); files beyond 10 MB may cause brief UI latency.
3. **Threading & Sub-channels:** Slack thread hierarchies are flattened into sequential chronological order for the MVP.
4. **Single Active Conversation:** The MVP processes and displays one active conversation at a time in memory.
5. **No External Integrations:** No direct OAuth connections to Slack/Teams/WhatsApp APIs; all data enters through local file upload or the built-in sample.

---

## 5. Pages & Views

The application is structured as a single-page responsive dashboard (`App.tsx`) with two primary modes:

### 5.1. Empty / Import State (Welcome View)
- **Hero Banner:** "What Did I Miss? — Catch up on unread chats in seconds."
- **Primary CTA:** Prominent "Load Sample Conversation" button (instant 1-click evaluation).
- **Upload Dropzone:** Drag-and-drop file target accepting `.json` and `.txt` files with format badges.
- **Privacy Assurance Badge:** "100% Private & On-Device. Your messages never leave your browser."
- **Quick Format Guide:** Collapsible sample format snippets.

### 5.2. Active Dashboard State
- **Sticky Top Bar:**
  - File/Conversation title and total message count.
  - "Personal Catch-Up" input ("Filter for me: @name").
  - "Load New File" / "Reset" button.
  - "Copy Summary" export button.
  - Transparent badge: "Rule-Based Heuristic Analysis".
- **Executive Recap Bar (Top Cards):**
  - **Quick Stats:** Total Messages, Participants Count, Time Span, Identified Urgencies.
  - **Executive Summary:** Bulleted overview synthesizing active topics and key outcomes.
- **Main Content Split / Grid:**
  - **Left / Primary Column — Categorized Findings:**
    - Filter pills: `All Findings`, `Urgent (P0)`, `Action Items`, `Decisions`, `Deadlines`, `Mentions`.
    - Finding cards with category badge, urgency pill, extracted text, sender, timestamp, and "Jump to message" CTA.
  - **Right Column — Chronological Transcript View:**
    - Search input for real-time text query.
    - Participant filter dropdown.
    - Scrollable message timeline with timestamp, sender avatar/initials, and text.
    - Active highlight indicator for messages targeted by deep links.

---

## 6. Components Architecture

- **`App`**: Root coordinator managing active conversation state, analysis state, search/filter criteria, and target message scroll ref.
- **`Header`**: Brand logo, active dataset status, privacy badge, action buttons (Copy Summary, Reset).
- **`Dropzone`**: File upload handler with drag-and-drop feedback, file validation, and "Load Sample" trigger.
- **`RecapCard`**: Executive summary widget displaying message statistics, time frame, and key topics.
- **`FindingsFilter`**: Category selection chips and personalized "@username" input filter.
- **`FindingsList`**: Renders prioritized cards categorized by Action Item, Decision, Deadline, Urgent alert, or Mention.
- **`FindingCard`**: Individual finding displaying category icon, urgency pill, sender, snippet, and deep-link click handler.
- **`TranscriptViewer`**: Chronological message list with search filtering, sender tags, and automatic scroll-into-view behavior.
- **`MessageItem`**: Individual chat message row supporting search highlighting and deep-link pulse animation.
- **`ErrorBanner`**: Dismissible error alert for malformed inputs or empty files.

---

## 7. User Interactions

1. **Load Built-In Sample:** User clicks "Load Sample Conversation" -> Instant transition to Dashboard with pre-computed analysis.
2. **Upload Conversation File:** User drags `.txt` or `.json` file -> File reader processes text -> Normalizer parses messages -> Heuristic engine analyzes -> Dashboard populates (< 300ms).
3. **Filter by Finding Category:** User clicks "Action Items" -> Findings list updates to show only action items.
4. **Deep-Link to Source Message:** User clicks on any finding card -> Transcript auto-scrolls smoothly to the source message, glowing with an accent border/pulse.
5. **Personalized Search:** User enters their name in "Filter for me" -> Highlights items addressing or assigning tasks to that user.
6. **Export Findings:** User clicks "Copy Summary" -> Formatted Markdown recap and action items are copied to system clipboard with a toast notification.
7. **Clear / New File:** User clicks "Load New File" -> Current memory state is cleared, returning cleanly to the import dropzone.

---

## 8. Backend Requirements

- **Backend Status:** **None (N/A for MVP).**
- All parsing, normalization, heuristic extraction, priority scoring, and search/filtering execute purely in the user's browser.
- Eliminates server setup costs, network latency, deployment complexity, and privacy leak risks during the hackathon.

---

## 9. API Requirements

- **External Network APIs:** **None.**
- **Internal Functional Contracts (TypeScript):**
  - `parseConversation(rawContent: string, fileName: string): Promise<ParsedMessage[]>`
  - `analyzeConversation(messages: ParsedMessage[], userFilter?: string): ConversationAnalysis`
  - `scoreUrgency(item: RawFinding): UrgencyLevel`

---

## 10. Data Requirements & Schemas

### 10.1. Internal Message Model
```typescript
export interface ParsedMessage {
  id: string;             // Unique identifier (UUID or msg-{index})
  sender: string;         // Display name or handle of the author
  timestamp?: string;     // ISO 8601 string or normalized date/time string
  text: string;           // Cleaned message body
  raw: string;            // Original raw message line
  lineIndex: number;      // 0-indexed position in source file
}
```

### 10.2. Finding Model
```typescript
export type FindingCategory = 'urgent' | 'action_item' | 'decision' | 'deadline' | 'mention';
export type UrgencyLevel = 'high' | 'medium' | 'low';

export interface FindingItem {
  id: string;
  sourceMessageId: string;
  category: FindingCategory;
  urgency: UrgencyLevel;
  title: string;
  snippet: string;
  sender: string;
  timestamp?: string;
  assignee?: string;      // If detected (e.g. for action items)
  dueDate?: string;       // If detected (e.g. for deadlines)
}
```

### 10.3. Conversation Analysis Result
```typescript
export interface ConversationAnalysis {
  recap: {
    totalMessages: number;
    participantCount: number;
    participants: string[];
    startTime?: string;
    endTime?: string;
    topTopics: string[];
    summaryBullets: string[];
  };
  findings: FindingItem[];
  stats: {
    urgentCount: number;
    actionItemCount: number;
    decisionCount: number;
    deadlinesCount: number;
    mentionsCount: number;
  };
}
```

---

## 11. Privacy Boundaries & Security Model

- **Zero-Network Architecture:** No `fetch`, `axios`, or WebSocket calls are made with user conversation data.
- **No Third-Party Analytics:** No Google Analytics, Mixpanel, or telemetry tracking libraries.
- **Ephemeral In-Memory State:** Conversation text and analysis results exist only in React component state / browser memory. Refreshing or clicking "Reset" removes the data.
- **Zero Cloud LLM Transmission:** No API keys are requested; no data is forwarded to remote inference providers.
- **Local Storage Policy:** Only non-sensitive UI preferences (such as dark/light theme or dismissed hints) may be persisted in browser `localStorage`.

---

## 12. Error States & Edge Cases

| Condition | User-Facing Behavior | Technical Mitigation |
|---|---|---|
| **Empty File (0 bytes or whitespace)** | Warning banner: *"The selected file is empty. Please select a file containing messages."* | Guard clause checking `file.size === 0` and `content.trim().length === 0`. |
| **Malformed JSON** | Alert banner: *"Unable to parse JSON. Please check file formatting or upload as a text export."* | `try...catch` around `JSON.parse` with friendly error message; does not crash app. |
| **Unrecognized TXT Format** | Info banner: *"Could not detect timestamp headers; parsed lines as generic sequence."* | Fallback parser creates messages with sequential IDs and empty timestamps. |
| **Missing Timestamps** | Messages rendered with chronological sequence order indicator; timestamps marked *"Time not specified"*. | Optional `timestamp` field in schema; sort defaults to file line order. |
| **Duplicate Message IDs** | Silent normalization; IDs appended with `-idx`. | Parser guarantees unique IDs using `crypto.randomUUID()` or `msg-${index}`. |
| **Very Large File (> 10MB)** | Warning banner: *"Large file detected (>10MB). Processing may take a few seconds."* | File size check before reading; chunked processing if needed. |

---

## 13. Non-Functional Requirements

- **Performance:** Parse and analyze 1,000 messages in under 300ms on a standard laptop browser.
- **Responsiveness:** Fluid layout supporting desktop (split pane), tablet, and mobile (tabbed navigation).
- **Usability:** 1-click path from page load to demonstrable insights via the built-in sample.
- **Visual Polish:** High contrast, clean typography, Tailwind CSS styling, consistent Lucide icons.
- **Accessibility:** Accessible color contrast ratios for urgency badges (`High` = Red/Rose, `Medium` = Amber/Orange, `Low` = Blue/Emerald).

---

## 14. 3-Hour-45-Minute Implementation Order

| Time Window | Phase | Primary Objective & Deliverables |
|---|---|---|
| **0:00 – 0:30** | **Phase 1: Architecture, Types & Sample Dataset** | - Define TypeScript models (`ParsedMessage`, `FindingItem`, `ConversationAnalysis`).<br>- Create realistic built-in sample dataset (`sampleConversation.ts`) with 20 realistic messages covering all finding types. |
| **0:30 – 1:15** | **Phase 2: Parsing & Normalization Engine** | - Build `txtParser.ts` (regexes for bracketed timestamps, WhatsApp, sender prefixes, multi-line continuation).<br>- Build `jsonParser.ts` (handles arrays, object envelopes, Slack format, key aliasing).<br>- Unit-test parsers with edge case fixtures. |
| **1:15 – 2:00** | **Phase 3: Heuristic Extraction & Scoring** | - Build rule-based detectors for Action Items, Decisions, Deadlines, Urgency, Mentions.<br>- Implement priority scoring (`high`/`medium`/`low`).<br>- Build executive recap synthesis function. |
| **2:00 – 2:45** | **Phase 4: Dashboard UI & Deep Linking** | - Build Hero dropzone with "Load Sample" button.<br>- Build Executive Recap metrics & Finding Cards.<br>- Build Transcript Viewer with scroll-to-element and visual glow highlight. |
| **2:45 – 3:15** | **Phase 5: Search, Filtering & Export (P1 Features)** | - Real-time keyword search bar.<br>- Category filter tabs & Participant dropdown.<br>- "Copy Summary to Clipboard" feature. |
| **3:15 – 3:45** | **Phase 6: Edge Cases, Polish & Final Demo Verification** | - Verify error states (malformed JSON, empty file).<br>- Polish Tailwind UI styling, badges, transitions.<br>- Re-test full demo flow end-to-end. |