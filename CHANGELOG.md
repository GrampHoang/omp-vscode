# Change Log

All notable changes to the "OMP Chat" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.8.0] - 2026-09-24

Initial release of the **GrampHoang/omp-vscode** fork.

### ✨ New in This Fork (0.8.0 vs. Base Repo)

#### Controls & Interactivity
- **Live Reasoning / Thinking Level Selector:** Added an in-place dropdown popover next to the model pill in the composer to view and adjust thinking levels live (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `auto`) via OMP's `set_thinking_level` RPC without restarting the session. If the selected model does not support reasoning, it cleanly indicates `Thinking: off` and disables the picker.
- **In-Place Toggles Popover Menu:** Added an interactive floating menu button near composer actions to toggle **Advisor Review Mode** (`ON` / `OFF`) and toggle visibility for **Thinking Blocks**, **Terminal Runs**, and **Tool Activity**. The popover stays open during clicks for seamless multi-option toggling.
- **Integrated Slash Commands:** Added `/advisor [on|off|status]` and `/thinking [level]` to autocomplete and command routing.
- **Native OMP Status Notices:** Captured native OMP `command_output` events to display status and confirmation notices (e.g. `"Advisor enabled."`, `"Advisor is enabled..."`) directly as formatted system messages in the chat transcript.

#### Layout & UI Bug Fixes
- **Code Block Overflow Fix:** Fixed horizontal code block overflow and action button clipping in narrow/short sidebars using bounded flexbox and scoped horizontal scrolling.
- **Phantom Message Gap Elimination:** Fixed a layout bug where hiding thinking and tool cards produced empty DOM message containers that stacked flexbox gaps, creating large blank spaces between prompt and response.
- **Natural Thinking Block Sizing:** Removed arbitrary height caps and internal scrollbars from `.thinking-body` (`height: auto; max-height: none; overflow: visible`) so thoughts size naturally to their content without ballooning or scrollbars.
- **Trailing Newline Stripping:** Automatically stripped trailing newlines from reasoning tokens so single-line thoughts render as a single slim line.
- **Composer Model Label Fix:** Fixed an issue where `state.model` was dropped during session initialization, restoring active model name display on the composer pill.
- **First-Press Shift+Enter Line Break:** Handled native line-break insertion in the composer so `Shift+Enter` immediately creates a visible newline on the very first press.
- **Scroll Restoration:** Preserved reading scroll positions across non-sticky re-renders.

#### Developer Tooling
- **Isolated Side-by-Side Dev Packager:** Added `npm run package:dev` script to automatically bundle `oh-my-pi-chat-dev.vsix` with a dedicated extension ID and view container, allowing developers to test dev builds without overwriting their daily work extension.

---

### 📦 Base Repository Capabilities (Inherited from `Chakyiu/omp-vscode`)
- **Multi-Tab Sessions:** Each chat tab is its own isolated local `omp --mode rpc` session.
- **Streaming Responses:** Live token-by-token response streaming from Oh My Pi.
- **Interactive Tool Execution:** Visual cards for OMP tool activity (Bash, Read, Edit, Write, Grep, etc.).
- **Context Usage Meter:** Per-session token usage meter and circular progress ring.
- **File & Terminal Attachments:** Attach files, folders, and terminal output via `@` inline mentions and editor context menus.
- **Auto-Generated Session Titles:** Agent-generated session titles for tabs using OMP's tiny/smol title model.
- **Tab History & Persistence:** Survives VS Code restarts and allows browsing and resuming past OMP sessions.
- **Tab Context Menu:** Right-click tabs to rename, export as plain text, or copy session content.
