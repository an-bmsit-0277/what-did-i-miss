# What Did I Miss?

> **Catch up on unread conversations in seconds — 100% on-device, privacy-preserving, and instant.**

[![Privacy: 100% On-Device](https://img.shields.io/badge/Privacy-100%25%20On--Device-success)](#privacy-guarantee)
[![Zero Backend](https://img.shields.io/badge/Backend-Zero%20Network%20Calls-blue)](#architecture)
[![NLP: Rule-Based Heuristics](https://img.shields.io/badge/Analysis-Deterministic%20Heuristics-orange)](#honest-analysis-disclosure)
[![Stack: React + Vite + TS](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20TS%20%7C%20Tailwind-purple)](#tech-stack)

---

## The Unread Problem

When engineers, managers, and teammates step away for meetings, time off, or focused work, they routinely return to hundreds of unread chat messages across Slack, WhatsApp, Teams, or Discord.

Scanning threads sequentially is slow, exhausting, and error-prone. Critical decisions, urgent blockers, assigned tasks, and looming deadlines get lost in conversational chatter.

**What Did I Miss?** solves this by instantly analyzing exported conversation files—or a built-in realistic demo—entirely within your browser. It extracts and prioritizes essential insights, scoring them by urgency and linking every single finding directly back to its original message in the transcript timeline.

---

## Key Features

- **Instant Built-In Demo:** One click loads a realistic team incident and deployment catch-up scenario, so you can explore all capabilities immediately without looking for test files.
- **Multi-Format Ingestion:** Drag and drop local `.txt` or `.json` chat exports (Slack exports, WhatsApp exports, timestamped transcripts, and generic message lists).
- **Intelligent Heuristic Extraction:**
  - **Executive Recap:** Message count, active contributors, time span, and top conversational topics.
  - **Action Items & Tasks:** Detects imperative tasks, commitments, and assignees.
  - **Key Decisions:** Surfaces agreements, approvals, and consensus calls.
  - **Deadlines & Dates:** Highlights temporal commitments (EOD, specific times, dates).
  - **Urgent / Blocker Alerts:** Pinpoints P0 issues, production incidents, outages, and blockers.
  - **Mentions & Direct Queries:** Highlights `@username` callouts and direct questions.
- **Urgency & Relevance Scoring:** Automatically triages findings into `High`, `Medium`, and `Low` priority levels based on urgency markers and actionable context.
- **Source Message Deep Linking:** Every finding card links directly to its source message. Clicking the card smoothly scrolls the transcript to the exact message and pulses a highlight ring.
- **Search & Multi-Dimensional Filtering:** Filter by finding category, specific participant, or enter your name in the "Filter for me" search box to see tasks and mentions addressed to you.
- **100% On-Device Privacy:** Zero network calls, zero server-side storage, zero cloud LLM uploads. Your conversations never leave your device.
- **Resilient & Error-Proof:** Gracefully handles malformed JSON, empty files, missing timestamps, and irregular multi-line messages without crashing.

---

## Honest Analysis Disclosure

> [!NOTE]
> **Heuristic Rule-Based Pattern Analysis:**  
> This application uses transparent, deterministic regular expressions and keyword pattern matching running directly in your browser. It does not claim to use generative artificial intelligence or cloud-based LLM inference. All insights are generated deterministically and linked directly to verifiable source messages.

---

## Supported Import Formats

The application accepts both `.json` and `.txt` files:

### 1. JSON Exports
- **Standard Array:** Array of objects with `sender`, `text`, and optional `timestamp` / `id`.
  ```json
  [
    { "sender": "Maya", "text": "CRITICAL: Database migration stalled.", "timestamp": "2026-10-09T09:15:00Z" }
  ]
  ```
- **Envelope Object:** `{ "channel": "war-room", "messages": [ ... ] }`
- **Slack Export JSON:** Array containing `ts`, `text`, and `user` / `user_profile.real_name`. Flexible field aliasing handles `author`, `content`, `body`, and `time`.

### 2. TXT Exports
- **Bracketed Timestamp:** `[2026-10-09 09:15:00] Maya: Critical DB issue.`
- **WhatsApp Export:** `10/09/26, 09:15 AM - Maya: Critical issue.` or `[10/09/2026, 9:15:00 AM] Maya: ...`
- **Simple Colon Format:** `Maya: Action item: verify rollback by 11 AM.`
- **Multi-Line Continuation:** Lines following a message that lack a timestamp/sender header are automatically appended to the preceding message body.

---

## Tech Stack

- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Build Tool:** Vite 8
- **Language:** TypeScript 5.8+
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons:** Lucide React (`lucide-react`)
- **Backend:** None (100% Client-Side Architecture)
- **External Dependencies Added:** None (Zero added dependencies policy)

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Quick Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Open the displayed local URL (typically `http://localhost:5173/`) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

### Chrome Extension Installation (Manifest V3)

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** (top right switch).
3. Click **Load unpacked** (top left).
4. Select the `extension/` folder in this repository (`What-Did-I-Miss/extension/`).
5. Open the Chrome Side Panel (or click the **Missed.** extension icon in the toolbar).
6. Navigate to [web.whatsapp.com](https://web.whatsapp.com/), open any chat, and click **"Catch me up"** to analyze the active conversation on-device!
   *(You can also click **"Load Demo"** in the side panel header at any time to explore the interface without an active WhatsApp Web tab).*

---

## Privacy Guarantee

- **Zero Cloud Transmission:** Chat logs and summaries are processed entirely inside browser memory.
- **No Third-Party Analytics:** No remote tracking or telemetry scripts.
- **Ephemeral State:** Closing or refreshing the page clears conversation data from memory.

---

## Project Structure

```text
What-Did-I-Miss/
├── docs/
│   ├── REQUIREMENTS.md       # Full requirements specification (P0/P1/P2)
│   ├── ARCHITECTURE.md       # Architectural design, data flow & decisions
│   ├── AI_CONTEXT.md         # Template hackathon context
│   └── API.md                # Internal contracts documentation
├── frontend/
│   ├── src/
│   │   ├── components/       # Dashboard, Dropzone, Findings, Transcript
│   │   ├── data/             # Built-in sample conversation dataset
│   │   ├── heuristics/       # Rule-based NLP extraction & urgency scoring
│   │   ├── parsers/          # Resilient TXT & JSON parsing engines
│   │   ├── types/            # TypeScript contracts (ParsedMessage, FindingItem)
│   │   ├── App.tsx           # State coordinator & layout
│   │   └── main.tsx          # App entry point
│   └── package.json
├── AI_INSTRUCTIONS.md        # AI team roles and development guidelines
├── prompt.md                 # AI prompt log
└── README.md                 # Project overview and documentation
```

---

## Documentation Links

- [Requirements Specification (docs/REQUIREMENTS.md)](file:///docs/REQUIREMENTS.md)
- [Architecture & Design Guide (docs/ARCHITECTURE.md)](file:///docs/ARCHITECTURE.md)
- [AI Development Guidelines (AI_INSTRUCTIONS.md)](file:///AI_INSTRUCTIONS.md)
