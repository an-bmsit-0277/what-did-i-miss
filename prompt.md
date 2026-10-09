# AI Prompt Log — What Did I Miss?

## Project
- Challenge: The Unread Problem — "What Did I Miss?"
- Purpose: Summarize unread conversations and prioritize important information.
- Privacy: Conversation contents and summaries must remain on the user's device.

## Code Generation Prompts

<!-- Before sending any code-generation prompt to an AI agent,
paste the exact prompt here and save this file first. -->

## Code Modification Prompts

<!-- Record prompts that ask an AI to modify or fix application code. -->

## Notes
- Record the tool used and the purpose of each prompt.
- Keep the complete prompt text.
- Record revised prompts separately when they are sent again.

## Prompt 1 — Requirements and Architecture

- **Tool:** Antigravity
- **Purpose:** Finalize requirements and architecture documentation.
- **Exact prompt:** Read AI_INSTRUCTIONS.md, docs/REQUIREMENTS.md, docs/ARCHITECTURE.md, and README.md.

Update ONLY these documentation files:
- docs/REQUIREMENTS.md
- docs/ARCHITECTURE.md
- README.md

Do not modify application code, package files, or configuration.

Project: What Did I Miss?
Challenge: The Unread Problem — help users catch up on unread conversations.

Requirements:
1. Import supported local .txt and .json conversation exports.
2. Include a realistic built-in sample conversation so the demo works immediately.
3. Parse messages into a consistent internal format with sender, text, and timestamp where available.
4. Generate a concise recap, important messages, decisions, action items, mentions, and deadlines.
5. Prioritize findings by urgency and relevance, and link each finding to its source message.
6. Provide search/filtering and a clear, polished dashboard.
7. Handle malformed files, empty conversations, and missing timestamps gracefully.
8. Keep conversation contents and summaries on-device. Do not upload them to a backend or remote AI API.
9. Do not claim to provide true AI-generated summaries if the initial implementation uses rules. Clearly distinguish heuristic analysis from AI inference.
10. Build the smallest complete and reliable MVP suitable for a short hackathon.

Architecture:
- React + TypeScript + Vite.
- Tailwind CSS and Lucide React.
- Browser-side parsing and analysis.
- No backend or database for the initial MVP.
- Use local browser storage only if genuinely needed.
- Keep parsing, prioritization, and UI logic modular and testable.

Classify requirements as P0, P1, and P2. Specify supported import formats, limitations, data flow, privacy boundaries, error states, and an implementation order suitable for a 3-hour-45-minute competition.

Inspect the existing files before editing. Preserve useful template guidance. Do not add dependencies. Report the documentation changes and any unresolved assumptions. Make no application-code changes.

## Prompt 2 — MVP Implementation
Read `AI_INSTRUCTIONS.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, and `README.md` before making changes.

Build the first working MVP of **What Did I Miss?** in the existing project.

## Rules
- Inspect the existing frontend structure and reuse the current template.
- Do not recreate the Vite project or reinstall existing dependencies.
- Do not modify package files or add dependencies unless absolutely necessary.
- Keep all conversation parsing and analysis in the browser.
- Never upload conversation contents or summaries to a backend or remote AI API.
- Do not claim the rule-based analysis is genuine LLM-generated AI.
- Keep the implementation simple enough to finish and test within this hackathon.
- Do not implement optional P2 features yet.

## Implement in this order

1. Create a realistic built-in sample conversation that works immediately when the app opens.
2. Define a consistent TypeScript message model with an ID, sender, text, and optional timestamp.
3. Implement browser-side imports for `.txt` and `.json` files. Handle invalid files, empty conversations, and missing timestamps gracefully.
4. Implement deterministic, rule-based analysis to identify:
   - A concise conversation recap
   - Important messages
   - Decisions
   - Action items and tasks
   - Mentions and deadlines
   - Urgency and relevance priorities
5. Link each finding to its original message so the user can inspect the context.
6. Build a polished, responsive dashboard with clear sections, useful icons, readable priority indicators, and a way to search or filter findings.
7. Make the privacy boundary visible in the UI: conversation data is processed locally in the browser.
8. Ensure the existing project builds successfully.

## Scope control
Prioritize a complete end-to-end demo using the sample conversation and local file imports. If time is limited, simplify the analysis rules rather than leaving core features incomplete. Defer charts, configurable keyword systems, and remote AI integrations.

## Verification
After implementation:
- Run the existing production build command.
- Fix any errors caused by your changes.
- Summarize the files changed, features completed, build result, and any remaining limitations.
- Do not claim that features or tests passed unless you actually ran them.

Make the changes directly in the existing workspace.

## Prompt 3 — Compact WhatsApp Catch-up UI
Continue in the existing What-Did-I-Miss project. The initial MVP has already been implemented. Inspect the current source code and preserve all working functionality.

## Objective
Transform the current dashboard into a polished, compact interface for a future Chrome extension called "Missed." that helps users catch up on WhatsApp conversations with one click.

## Critical rules
- Do not recreate the project or replace the existing analysis engine.
- Reuse the existing message types, parsers, heuristics, sample conversation, filtering, and source-message navigation.
- Do not remove existing working import or export functionality.
- Do not add dependencies or modify package files unnecessarily.
- Do not implement WhatsApp integration or a Chrome extension manifest in this task.
- Keep all conversation processing on-device.
- Keep the interface honest about using deterministic, rule-based analysis.

## Design requirements
Design for a narrow extension side panel approximately 360–400px wide, while retaining a usable full-browser preview.

- Compact, information-dense layout with minimal wasted space.
- Clean, modern interface with restrained WhatsApp-inspired green accents, neutral backgrounds, subtle borders, and consistent typography.
- Avoid oversized headings, large empty areas, excessive metric cards, charts, and wide desktop-only grids.
- Use existing Tailwind CSS and Lucide React dependencies.
- Ensure the layout remains readable at narrow widths.

## Layout
1. A compact header with the Missed. logo/name, privacy indicator, refresh action, and a small menu for secondary actions.
2. A conversation selector/header displaying the active conversation name, number of analyzed messages, and sample/import status.
3. Three small summary counters: urgent, tasks, and decisions.
4. Compact tabs: Overview, Tasks, Important.
5. Overview:
   - Short recap, limited to a few lines.
   - Highest-priority findings first.
   - Decisions and key deadlines.
   - A short actionable task list.
6. Tasks:
   - Task description, assignee if detected, deadline if available, priority, and working completion checkbox.
7. Important:
   - Important messages, direct mentions, decisions, and deadlines.
8. Compact search and useful category filters without letting controls consume too much space.
9. Clicking a finding should continue to reveal or highlight its original transcript message.
10. Keep Load Sample, Upload File, Copy Summary, and Reset accessible without cluttering the main view. Use a compact menu for secondary actions if appropriate.
11. Include clear empty, loading, and error states.

## Functionality and implementation
- Inspect App.tsx and existing components before editing.
- Reuse and refactor existing components instead of duplicating business logic.
- Ensure tabs, checkboxes, search, filters, upload, export, and source navigation continue working.
- Persist task completion only for the current session unless persistent storage is already implemented.
- Do not hardcode summary counts that disagree with the active conversation analysis.
- Ensure the built-in sample loads immediately.
- The website must remain a working preview of the future extension side panel. Do not falsely claim it already reads WhatsApp Web.

## Additional product requirements

- Make the primary action a prominent but compact **"Catch me up"** button. Clicking it must analyze the currently loaded conversation and update the recap and prioritized findings.
- The first screen should immediately answer: "What did I miss?", "What needs my attention?", and "What do I need to do?"
- Keep the interface compact and interactive, with a clear visual hierarchy and minimal empty space.
- Make the side panel feel like a companion to WhatsApp Web, not a generic analytics dashboard.
- Structure the UI so the same React components can be reused inside a future Chrome extension side panel.
- For the first checkpoint, make the website preview fully functional using the built-in sample and local file imports.
- After the website is stable, the next milestone will be a minimal Chrome extension that can read messages visible in the active WhatsApp Web conversation, let the user click "Catch me up", and show the analysis in the extension side panel.
- Do not claim that the website currently integrates with WhatsApp. Do not attempt to access private APIs or transmit chat contents to external services.

## Verification
Run the existing lint and production build commands. Fix regressions introduced by this task. Report changed files, features verified, and any remaining limitations. Do not claim verification unless the commands actually succeed.