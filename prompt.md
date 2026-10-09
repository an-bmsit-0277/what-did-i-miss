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