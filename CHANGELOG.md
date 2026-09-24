# Change Log

All notable changes to the "OMP Chat" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.8.0] - 2026-09-24

### Added
- **Reasoning Level Picker:** In-place dropdown popover in the composer to view and adjust thinking levels live (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `auto`) via live OMP RPC `set_thinking_level`.
- **Composer Toggles Popover:** Interactive floating menu near composer actions to toggle Advisor Review Mode and control visibility for Thinking, Terminal Runs, and Tool Activity.
- **Slash Commands:** Added `/advisor [on|off|status]` and `/thinking [level]` with autocomplete support.
- **OMP Status Outputs:** Captured native OMP `command_output` events to display status and confirmation notices cleanly in the chat thread.
- **Automated Dev Packager:** Added `npm run package:dev` script to bundle isolated, side-by-side test builds (`oh-my-pi-chat-dev.vsix`) without overwriting production installs.

### Fixed
- **Code Block Overflow:** Fixed horizontal overflow and button clipping in narrow or short chat viewports.
- **Phantom Message Gaps:** Eliminated accumulated empty flex space when thinking and tool calls are hidden.
- **Natural Thinking Block Sizing:** Removed arbitrary height caps and internal scrollbars so open thought blocks fit their content naturally.
- **Model Name Display:** Restored active model label on the composer model pill.
- **Trailing Newlines in Thoughts:** Stripped trailing `\n+` from reasoning tokens so single-line thoughts don't balloon in height.
- **Input Line Breaks:** Used native line-break insertion so `Shift+Enter` immediately creates a visible newline on the first press.
- **Scroll Restoration:** Preserved reading scroll positions across non-sticky re-renders.
