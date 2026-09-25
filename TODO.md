# OMP VS Code Extension Roadmap & TODO

This document tracks upcoming features, improvements, and backlog items for the **OMP Chat** extension.

---

## 🎯 Next Sprint Priorities

### 1. Slash Commands Expansion
- [ ] **`/resume [id]`:** Add `/resume` slash command to pick and resume past OMP sessions directly in the current chat tab (with QuickPick session search).
- [ ] **Native OMP Slash Commands:** Wire native OMP RPC commands into autocomplete and routing:
  - `/compact` — Trigger context compaction/summarization to free up token budget.
  - `/export` — Export conversation thread to standalone HTML or Markdown.
  - `/share` — Create an end-to-end encrypted web share link.
  - `/usage` — Detailed context usage and token reports.
- [ ] **`/skill:*` Autocomplete:** Expose all project skills (e.g. `/skill:brainstorming`, `/skill:test-driven-development`, `/skill:systematic-debugging`) in the composer's slash-command autocomplete menu.

### 2. Approval Modes Popover (Replacing "Agent" Button)
- [ ] **Replace Dummy `#modeBtn`:** Remove the cosmetic "Agent" pill (inherited from Cursor UI) that cycles dummy strings.
- [ ] **Approval Mode Selector:** Replace it with an in-place dropdown popover:
  - `Approval: YOLO ▾` — Full autonomous speed (auto-approve all tools).
  - `Approval: Write ▾` — Auto-approve read tools; ask before writing or running terminal commands.
  - `Approval: Ask ▾` — Interactive confirmation for every tool call.
- [ ] **Live RPC / Config Sync:** Update active session approval mode live without requiring manual edits in `settings.json`.

### 3. Workflow & Skills Execution Popover
- [ ] **Workflow Popover Button:** Add an in-place dropdown popover in the composer for defined workflows.
- [ ] **One-Click Skill Triggering:** Search and trigger project workflows directly from the composer without typing commands.
- [ ] **Execution Policy & Prewalk:** Toggle prewalk mode (switching from reasoning planner model to fast implementer model after plan creation).

### 4. Distinct User Prompt Styling & Contrast
- [ ] **The Problem:** Current `.msg.user .bubble` uses `--chip` (`color-mix(in srgb, var(--text) 5%, transparent)`), which blends directly into the VS Code sidebar background and makes it hard to distinguish user prompts from assistant replies when scanning the chat.
- [ ] **Elevated Prompt Background:** Style user prompt bubbles with a distinctly elevated, higher-contrast background (e.g. `color-mix(in srgb, var(--vscode-editorWidget-background, var(--panel)) 85%, var(--link) 8%)`).
- [ ] **Visual Distinction Marker:** Add a subtle accent border (e.g. left border in `var(--link)`) or a clean "You" sender label to make scrolling through past conversation turns effortless.

---

## 🛠️ Stability & Performance Fixes (Investigated Issues)

### 5. Multi-Window Session File Contention & Queue Freeze
- [ ] **The Problem:** Running two sessions (e.g. work extension + dev preview, or two windows) with `--continue` attaches both processes to the exact same `.jsonl` session database file. When a turn completes, concurrent writes trigger OMP's `Session persistence failed: Session file changed before rewrite` retry loop. Because OMP is trapped in write retries, `agent_end` never fires, the UI remains in an endless circling loop (`busy`), and queued messages are never dispatched.
- [ ] **Session Isolation:** Ensure each window/tab generates an isolated session ID at startup rather than blindly sharing the latest global `--continue` target.
- [ ] **Contention Auto-Fork:** Detect `Session persistence failed` notices on stderr and automatically fork the session to a fresh file to break the retry loop.
- [ ] **Safety Settle Fallback:** Add a safety turn-settle timer (e.g. 2–3s after text streaming completes) so queued follow-up prompts are never held hostage if a backend `agent_end` event is delayed or lost.

### 6. Webview Freeze & VS Code Renderer Crash on Large Outputs
- [ ] **The Problem:** In `src/omp/sessionHistory.ts:357`, historical tool outputs are hydrated using `outputPreview: textFromContent(row.content)`. Unlike live turns (which cap previews at 400–800 chars), `textFromContent` has no character limit. If a tool read a large file or dumped a huge terminal log, multi-megabyte raw text strings are loaded into message state. When `postState()` serializes this and the webview runs `messagesEl.innerHTML = ...`, Chromium freezes performing layout reflow and DOM parsing on hundreds of thousands of characters, triggering VS Code's "window not responding" watchdog and crashing the editor (while normal OMP CLI runs fine in its lightweight terminal buffer).
- [ ] **Bounded Historical Previews:** Enforce a hard ceiling (e.g. max 1,000–2,000 characters) on historical tool output previews in `sessionHistory.ts`.
- [ ] **Lazy-Mounted Tool Bodies:** Avoid injecting thousands of lines into the DOM for collapsed tool cards; only mount full outputs when the user explicitly clicks to expand that specific card.

---

## 💡 Backlog & Feature Suggestions

### 7. Interactive File Diff & Review
- [ ] **`[View Diff]` on Tool Cards:** Add an action button on file edit/write tool cards that opens VS Code's native side-by-side diff editor (`vscode.diff(originalUri, currentUri)`).
- [ ] **Inline Syntax Highlighting:** Enhanced diff previews directly inside chat cards.

### 8. Inline Turn Rollback ("Undo Changes")
- [ ] **Undo Changes Button:** One-click revert on assistant turns to roll back all files modified in that specific turn to their pre-turn state.

### 9. Pinned Context / Persistent File Bar
- [ ] **Pinned Files Strip:** Allow pinning reference files (e.g. `@spec.md`, `@types.ts`) above the composer so they stay in context across all turns in the session without needing to re-attach them every prompt.

### 10. Real-Time Token & Dollar Spend Tracker
- [ ] **Detailed Cost Breakdown:** Expand the context usage ring in the composer to display exact dollar spend (`$0.042`) and cache hit metrics (`input`, `output`, `cache-read`) from OMP's pricing data.

### 11. Conversation Rewind & Forking (`/rewind`, `/branch`)
- [ ] **Fork from Turn:** Right-click or hover on past user prompts to fork into a new tab or branch the conversation from that exact point.
