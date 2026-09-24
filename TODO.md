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
  - `/usage` / `/cost` — Detailed context usage and spend reports.
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

---

## 💡 Backlog & Feature Suggestions

### 4. Interactive File Diff & Review
- [ ] **`[View Diff]` on Tool Cards:** Add an action button on file edit/write tool cards that opens VS Code's native side-by-side diff editor (`vscode.diff(originalUri, currentUri)`).
- [ ] **Inline Syntax Highlighting:** Enhanced diff previews directly inside chat cards.

### 5. Inline Turn Rollback ("Undo Changes")
- [ ] **Undo Changes Button:** One-click revert on assistant turns to roll back all files modified in that specific turn to their pre-turn state.

### 6. Pinned Context / Persistent File Bar
- [ ] **Pinned Files Strip:** Allow pinning reference files (e.g. `@spec.md`, `@types.ts`) above the composer so they stay in context across all turns in the session without needing to re-attach them every prompt.

### 7. Real-Time Token & Dollar Spend Tracker
- [ ] **Detailed Cost Breakdown:** Expand the context usage ring in the composer to display exact dollar spend (`$0.042`) and cache hit metrics (`input`, `output`, `cache-read`) from OMP's pricing data.

### 8. Conversation Rewind & Forking (`/rewind`, `/branch`)
- [ ] **Fork from Turn:** Right-click or hover on past user prompts to fork into a new tab or branch the conversation from that exact point.
