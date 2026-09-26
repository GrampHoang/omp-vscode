# OMP VS Code Extension Roadmap & TODO

This document tracks upcoming features, improvements, and backlog items for the **OMP Chat** extension.

---

## 🚀 Completed in v0.8.0 Fork & Live OMP Sync

### 1. Independent Extension Fork & Identity Isolation
- [x] **Separate Identity & Package:** Forked and packaged as `gramphoang.oh-my-pi-chat-extend` ("GramHoang OMP Chat Extend") with dedicated activity bar container (`OMP Extend`), commands (`ompChatExtend.*`), views, and separate storage to run side-by-side with upstream OMP Chat without conflicts.

### 2. Native OMP Synchronization (Decoupled from `settings.json`)
- [x] **Zero `.vscode/settings.json` Writes:** Removed all writes and mandatory reads for `model`, `thinking`, `approvalMode`, and display toggles from `settings.json`.
- [x] **Preserve OMP Global Config:** OMP launches with its native user defaults (`~/.omp/agent/config.yml`) without forced CLI flags.
- [x] **Live Dynamic Model Switching:** Switched model live in active sessions using OMP RPC `set_model` (`{ type: "set_model", provider, modelId }`) without session restarts.
- [x] **Live Thinking Level Switching:** Updated reasoning effort live using OMP RPC `set_thinking_level` and `cycle_thinking_level`.
- [x] **RPC Available Models:** Implemented `get_available_models` via active RPC client.

### 3. Live Turn Progress & Action Tracking (Codex-Style)
- [x] **Live Elapsed Turn Timer:** Real-time ticker (`1s`, `2s`, ... `14s`, `1m 02s`) measuring total elapsed time for active assistant turns.
- [x] **Active Step / Action Badge:** Dynamic badge displaying the last/current action (`Running bash: npm test`, `Thinking: <snippet>`, `Completed tool · next step...`, `Responding...`) so users always know the model is actively progressing through multi-step tasks.
- [x] **Thinking Block Duration & Live Thought Preview:**
  - Dynamic duration label: `Thinking for 12s` (live) and `Thought for 14s` (completed).
  - Subtle one-line preview (`.thinking-preview`) in the collapsed summary showing the latest thought line in real time without needing to expand the card.

### 4. Robust Markdown Fenced Codeblock Parsing
- [x] **Fixed Inverted Backtick Bug:** Replaced naive `raw.split(/```/)` with a CommonMark-compliant line-anchored fence parser. Inline backticks in explanations no longer invert codeblocks or turn text like `or` into code.
- [x] **Unclosed Streaming Blocks:** Code blocks in active streaming responses remain cleanly confined without corrupting subsequent text.

### 5. Composer Action Bar & UI Density
- [x] **Composer Layout in Narrow Viewports (<350px):**
  - Right-side actions (`Send`, `Attach`, `Toggles`) locked with `flex-shrink: 0; margin-left: auto;` to prevent overflow clipping.
  - Left-side pills wrap gracefully with tighter text ellipsis caps (70–80px).
- [x] **Unified Dual-State Send/Stop Button:** Combined separate Send and Stop buttons into one adaptive control (Send `↑`, Stop `■`, Queue `+`).
- [x] **Approval Modes Dropdown Popover:** Replaced dummy "Agent" pill with a functional approval mode popover (`YOLO`, `Write`, `Ask`).
- [x] **Distinct User Prompt Styling:** Elevated prompt bubble contrast with left accent border (`border-left: 3px solid var(--link)`) and subtle tinting.

---

## 🎯 Next Sprint Priorities

### 1. Slash Commands & Skills Autocomplete
- [ ] **`/resume [id]`:** Add `/resume` slash command to pick and resume past OMP sessions directly in the current chat tab (with QuickPick session search).
- [ ] **`/skill:*` Autocomplete:** Expose all project skills (e.g. `/skill:brainstorming`, `/skill:test-driven-development`, `/skill:systematic-debugging`) in the composer's slash-command autocomplete menu.
- [ ] **Native OMP Slash Commands:**
  - [x] `/compact` — Trigger context compaction/summarization.
  - [x] `/usage` — Detailed context usage report.
  - [x] `/shake` — Shake and free soft memory.
  - [ ] `/export` — Export conversation thread to standalone HTML or Markdown.
  - [ ] `/share` — Create an end-to-end encrypted web share link.

### 2. Multi-Window Session File Contention & Queue Freeze
- [ ] **The Problem:** Running two sessions with `--continue` attaches both processes to the exact same `.jsonl` session file, triggering write contention retries where `agent_end` never fires and queued messages remain frozen.
- [ ] **Session Isolation:** Ensure each window/tab generates an isolated session ID at startup rather than blindly sharing the latest global `--continue` target.
- [ ] **Contention Auto-Fork:** Detect `Session persistence failed` notices on stderr and automatically fork the session to a fresh file to break the retry loop.
- [ ] **Safety Settle Fallback:** Add a safety turn-settle timer (2–3s after text streaming completes) so queued follow-up prompts are never held hostage.

### 3. Webview Freeze & VS Code Renderer Crash on Large Outputs
- [ ] **The Problem:** Historical tool outputs in `sessionHistory.ts` have no character limit. Multi-megabyte raw text dumps trigger Chromium reflow freezes and VS Code "window not responding" crashes.
- [ ] **Bounded Historical Previews:** Enforce a hard ceiling (e.g. max 1,000–2,000 characters) on historical tool output previews in `sessionHistory.ts`.
- [ ] **Lazy-Mounted Tool Bodies:** Avoid injecting thousands of lines into the DOM for collapsed tool cards; mount full outputs only when explicitly expanded.

### 4. Interactive File Diff & Review
- [ ] **`[View Diff]` on Tool Cards:** Add an action button on file edit/write tool cards that opens VS Code's native side-by-side diff editor (`vscode.diff(originalUri, currentUri)`).
- [ ] **Inline Syntax Highlighting:** Enhanced diff previews directly inside chat cards.
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
