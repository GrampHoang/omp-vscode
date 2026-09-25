# OMP VS Code Extension Roadmap & TODO

This document tracks upcoming features, improvements, and backlog items for the **OMP Chat** extension.

---

## 🎯 Next Sprint Priorities

### 1. Slash Commands Expansion
- [ ] **`/resume [id]`:** Add `/resume` slash command to pick and resume past OMP sessions directly in the current chat tab (with QuickPick session search).
- [ ] **Native OMP Slash Commands:** Wire native OMP RPC commands into autocomplete and routing:
  - [x] `/compact` — Trigger context compaction/summarization to free up token budget.
  - [ ] `/export` — Export conversation thread to standalone HTML or Markdown.
  - [ ] `/share` — Create an end-to-end encrypted web share link.
  - [x] `/usage` — Detailed context usage and token reports.
  - [x] `/shake` — Shake and free soft memory.
- [ ] **`/skill:*` Autocomplete:** Expose all project skills (e.g. `/skill:brainstorming`, `/skill:test-driven-development`, `/skill:systematic-debugging`) in the composer's slash-command autocomplete menu.

### 2. Approval Modes Popover (Replacing "Agent" Button)
- [x] **Replace Dummy `#modeBtn`:** Removed the cosmetic "Agent" pill that cycled dummy strings.
- [x] **Approval Mode Selector:** Replaced with an in-place dropdown popover:
  - `Approval: YOLO ▾` — Full autonomous speed (auto-approve all tools).
  - `Approval: Write ▾` — Auto-approve read tools; ask before writing or running terminal commands.
  - `Approval: Ask ▾` — Interactive confirmation for every tool call.
- [x] **Live RPC / Config Sync:** Updated active session approval mode live via RPC restart and configuration persistence.

### 3. Workflow & Skills Execution Popover
- [ ] **Workflow Popover Button:** Add an in-place dropdown popover in the composer for defined workflows.
- [ ] **One-Click Skill Triggering:** Search and trigger project workflows directly from the composer without typing commands.
- [ ] **Execution Policy & Prewalk:** Toggle prewalk mode (switching from reasoning planner model to fast implementer model after plan creation).

### 4. Composer Action Bar Overflow in Narrow Sidebars
- [ ] **The Problem:** In narrow viewports (<350px wide), the left controls (`Model` + `Thinking` + `Agent` + `Context Usage`) and the right buttons (`Toggles`, `Attach`, `Stop`, `Send`) collide horizontally. Because `.composer-actions` defaults to `nowrap`, the right-side elements (including the Send button) get pushed out of bounds past the right edge of the screen.
- [x] **Unshrinkable Right Actions:** Set `.right-actions { flex-shrink: 0; margin-left: auto; }` so the Send, Attach, and Toggle buttons are guaranteed to stay fully on-screen at all times.
- [x] **Adaptive Left Pills:** Made `.left-actions` shrinkable with `min-width: 0; flex-wrap: wrap; row-gap: 4px;` and enforced tighter ellipsis caps on `.pill-label` (70–80px).
- [x] **Drop Dummy "Agent" Pill:** Removed the unused "Agent" button, recovering ~60px of horizontal space.
- [x] **Combine Stop and Send into a Single Dual-State Button:** Eliminated the separate `#stopBtn` entirely. Uses a single modern button (like Claude/ChatGPT/Cursor):
  - When idle: shows `↑` (Send).
  - When generating with empty input: morphs into `■` (Stop) to cancel generation.
  - When generating with typed text: morphs into `+` (Queue) to queue a follow-up prompt.
  - Saves an entire button slot (~36px) and eliminates jarring layout shifts when the Stop button pops in and out.
- [x] **Compact Reasoning Pill:** Removed the word "Thinking:" so it displays just the level (`med ▾`, `high ▾`, `off ▾`), saving ~55px of space.
### 5. Distinct User Prompt Styling & Contrast
- [ ] **The Problem:** Current `.msg.user .bubble` uses `--chip` (`color-mix(in srgb, var(--text) 5%, transparent)`), which blends directly into the VS Code sidebar background and makes it hard to distinguish user prompts from assistant replies when scanning the chat.
- [x] **Elevated Prompt Background:** Styled user prompt bubbles with a distinctly elevated, higher-contrast background (`color-mix` with `var(--panel)` and `var(--link)` tint).
- [x] **Visual Distinction Marker:** Added an accent border on the left (`border-left: 3px solid var(--link)`) and elevation shadow to make scrolling through past conversation turns effortless.

---

## 🚀 Completed in v0.8.0 Fork & Live OMP Sync

### Independent Extension Fork
- [x] **Namespace & Identity Isolation:** Forked and packaged as `gramphoang.oh-my-pi-chat-extend` ("GramHoang OMP Chat Extend") with dedicated activity bar container (`OMP Extend`), commands (`ompChatExtend.*`), views, and separate storage to run side-by-side with upstream OMP Chat without conflicts.

### Native OMP Synchronization (Decoupled from `settings.json`)
- [x] **Zero `.vscode/settings.json` Writes:** Removed all writes and mandatory reads for `model`, `thinking`, `approvalMode`, and display toggles from `settings.json`.
- [x] **Preserve OMP Global Config:** OMP launches with its native user defaults (`~/.omp/agent/config.yml`) without forced CLI flags.
- [x] **Live Dynamic Model Switching:** Switched model live in active sessions using OMP RPC `set_model` (`{ type: "set_model", provider, modelId }`) without session restarts.
- [x] **Live Thinking Level Switching:** Updated reasoning effort live using OMP RPC `set_thinking_level` and `cycle_thinking_level`.
- [x] **RPC Available Models:** Implemented `get_available_models` via active RPC client.

### Live Codex-Style Turn Progress & Action Status
- [x] **Live Elapsed Turn Timer:** Real-time ticker (`1s`, `2s`, ... `14s`, `1m 02s`) measuring total elapsed time for active assistant turns.
- [x] **Active Step / Action Badge:** Dynamic badge displaying the last/current action (`Running bash: npm test`, `Thinking: <snippet>`, `Completed tool · next step...`, `Responding...`) so users always know the model is actively progressing through multi-step tasks.

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
