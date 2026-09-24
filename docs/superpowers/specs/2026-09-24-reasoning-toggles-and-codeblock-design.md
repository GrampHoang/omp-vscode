# Design Specification: Reasoning Level, Toggles, Slash Commands, Keybindings & Code Block Overflow

**Date:** 2026-09-24  
**Target:** `omp-vscode` extension  
**Status:** Approved design ready for planning  

---

## 1. Overview & Goals

The `omp-vscode` extension connects a VS Code webview chat UI to local `omp --mode rpc` sessions. While it provides streaming responses and tool activity, several interactive features from the OMP CLI are missing or inconvenient:
1. Users picking reasoning models (such as `gpt-5.6-sol`) cannot see or adjust their reasoning/thinking level from the chat UI without editing global VS Code settings.
2. Toggling thinking block visibility or expanding/collapsing thinking/tool cards lacks dedicated controls and keyboard shortcuts (`Ctrl+O`, `Ctrl+Shift+T`).
3. Toggling the OMP Advisor runtime (`/advisor on|off`) is missing, and native slash command text responses (`command_output` from OMP) are ignored.
4. Markdown code blocks in the chat window overflow or clip buttons when the chat window or sidebar is narrow or short.

This specification defines the architecture, data flow, component changes, and verification strategy for resolving these issues feature-by-feature with isolated git commits.

---

## 2. Architecture & Components

```
┌─────────────────────────────────────────────────────────────┐
│                       VS Code Host                          │
│                                                             │
│  ChatViewProvider <─────> SessionManager <───> TabManager   │
│         ▲                         ▲                         │
│         │                         │                         │
│         ▼                         ▼                         │
│   Webview HTML/JS          OmpRpcClient                     │
│  (Composer, Messages)             ▲                         │
│                                   │ stdio (JSON-RPC)        │
└───────────────────────────────────┼─────────────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │   omp --mode rpc     │
                         │   - set_thinking_level│
                         │   - cycle_thinking   │
                         │   - /advisor on|off  │
                         │   - thinking_changed │
                         └──────────────────────┘
```

### 2.1 Feature Breakdown

### Feature 1: Model Reasoning Level Pill & QuickPick
- **UI Element:** A new pill button (`#thinkingBtn`) positioned immediately to the right of `#modelBtn` in the composer's `.left-actions` bar.
  - Text label: `Thinking: <level>` (e.g. `Thinking: med`, `Thinking: high`, `Thinking: off`).
  - Visual state: If the active model has `reasoning: false` or does not support thinking, the pill shows `Thinking: off` and is subtly dimmed with an explanatory tooltip (`Model does not support reasoning`).
- **RPC & Backend:**
  - `OmpRpcClient`: Added methods `setThinkingLevel(level: string): Promise<void>` (sending `{ type: "set_thinking_level", level }`) and `cycleThinkingLevel(): Promise<string | null>`.
  - `OmpRpcClient` listens for `thinking_level_changed` event and notifies `SessionManager`.
  - `SessionManager`: Reads initial `thinkingLevel` from `get_state` and stores `activeThinkingLevel`. Emits change notifications to `ChatViewProvider`.
  - `ChatViewProvider`:
    - Handles click on `#thinkingBtn` (`pickThinkingLevel` message from webview).
    - Checks the active model's supported levels from `OmpModelInfo.thinking` (or falls back to default list: `["off", "minimal", "low", "medium", "high", "xhigh", "max"]`).
    - Opens a `vscode.window.showQuickPick` showing the available levels with an indicator of the current level.
    - Upon selection, calls `this.sessions.setThinkingLevel(level)` live on the running session and updates `ompChat.thinking` configuration.
    - Synchronizes updated state to the webview via message `{ type: "config", thinkingLevel, ... }`.

### Feature 2: Toggles Menu Button Near Send / Attach
- **UI Element:** A toggles button (`#togglesBtn`, icon: settings/sliders or toggle switch) positioned next to the attach/send controls.
- **Action:** Clicking sends `{ type: "showTogglesMenu" }` to the extension host.
- **Host Behavior:** `ChatViewProvider` displays a `vscode.window.showQuickPick` with checkboxes / quick items:
  1. `👁 Advisor: [Enabled | Disabled]` — toggles the advisor on the active session.
  2. `💭 Thinking Blocks: [Visible | Hidden]` — toggles `ompChat.showThinking` in the chat UI.
  3. `📂 Expand / Collapse All Thinking & Tools` — triggers immediate expansion or collapse of all activity cards in the active chat.
- **Live Updating:** Selecting any item immediately executes the toggle and updates the webview state without requiring full reload.

### Feature 3: Slash Commands (`/advisor`, `/thinking`) & Native RPC Output Handling
- **Autocomplete:** Add `/advisor` (`/advisor [on|off|status]`) and `/thinking` (`/thinking [level]`) to `SLASH_COMMANDS` in `media/chat.js`.
- **Command Dispatch:**
  - In `chatViewProvider.ts`:
    - `/advisor` or `/advisor on` / `/advisor off` / `/advisor status`:
      If an argument is given, dispatches via session manager prompt to OMP. If called bare as `/advisor`, opens a quick pick to choose `Turn on`, `Turn off`, or `Show status`.
    - `/thinking` or `/thinking <level>`: If level is provided, sets thinking level; if bare, opens the thinking level picker.
- **RPC `command_output` Event Handling:**
  - OMP RPC emits `{"type": "command_output", "text": "..."}` when executing slash commands like `/advisor on|off|status`.
  - `OmpRpcClient` emits `commandOutput: [string]`.
  - `SessionManager` receives this and creates a system message in the chat thread so the user sees the confirmation text (e.g. `"Advisor enabled."` or `"Advisor is enabled (openai-codex/gpt-5.6-terra)..."`).

### Feature 4: Keyboard Shortcuts & In-Chat Hotkeys
- **Extension Keybindings:**
  - `ompChat.toggleThinkingVisibility` (default: `Ctrl+Shift+T` / `Cmd+Shift+T`, when `view == ompChat.sidebar`).
  - `ompChat.toggleCollapseAll` (default: `Ctrl+O` / `Cmd+O`, when `view == ompChat.sidebar`).
- **Webview Keydown Handler:**
  - In `media/chat.js`, intercept `Ctrl+O` / `Cmd+O` to toggle all collapsible thinking/tool cards (expand all if any are closed, collapse all if all are open).
  - Intercept `Ctrl+Shift+T` / `Cmd+Shift+T` to toggle thinking block visibility.

### Feature 5: Code Block & Container Overflow / Cutoff Fix
- **CSS Improvements in `media/chat.css`:**
  - Apply `min-width: 0; max-width: 100%;` to `.msg`, `.bubble`, `.md-code`.
  - For `.bubble pre, .md-pre`:
    - Enforce `box-sizing: border-box; max-width: 100%; overflow-x: auto;`.
    - Ensure `.code-actions` has `flex-wrap: wrap;` and does not push past the message border.
    - Set `word-break: break-all;` fallback or clean horizontal scrollbar styling so narrow sidebars or short heights never push content off-screen.

---

## 3. Data Structures & Protocols

### 3.1 Webview ↔ Extension Protocol Extensions

```ts
// Webview -> Extension
type WebviewToHostMessage =
  | { type: "pickThinkingLevel" }
  | { type: "showTogglesMenu" }
  | { type: "toggleThinkingVisibility" }
  | { type: "toggleCollapseAll" }
  | { type: "runSlashCommand"; command: string; args?: string };

// Extension -> Webview
type HostToWebviewMessage =
  | {
      type: "config";
      thinkingLevel?: string;
      reasoningSupported?: boolean;
      showThinking?: boolean;
      advisorEnabled?: boolean;
      // existing fields...
    }
  | {
      type: "toggleCollapseAll";
      expand?: boolean;
    };
```

---

## 4. Verification Plan

1. **Compilation:** `npm run compile` and `npm run build` must succeed without TypeScript or lint errors.
2. **Feature 1 Test:**
   - Launch extension with `omp --mode rpc`.
   - Verify `#thinkingBtn` displays the current thinking level (`high`, `low`, etc.) from `get_state`.
   - Select Sol or Gemini model; open thinking picker; select `medium`.
   - Verify RPC event `thinking_level_changed` is received and `#thinkingBtn` updates to `Thinking: med`.
3. **Feature 2 & 3 Test:**
   - Click toggles menu button near send; toggle Advisor to On.
   - Verify OMP executes `/advisor on`, emits `command_output` (`Advisor enabled.`), and the chat shows the system message.
   - Run `/advisor status` and verify status message prints.
4. **Feature 4 Test:**
   - Press `Ctrl+O` in chat; verify thinking and tool cards toggle between expanded and collapsed.
   - Press `Ctrl+Shift+T`; verify thinking blocks toggle visibility.
5. **Feature 5 Test:**
   - Paste long single-line code block (`const a = "..."`) in a narrow chat sidebar.
   - Verify the code block scrolls horizontally inside its container without clipping the chat window, message bubbles, or action buttons.

---

## 5. Commit Strategy

Per user instruction, implement feature by feature into separate local commits:
1. `fix(css): prevent code block overflow and clipping in narrow/short chat view`
2. `feat(rpc): support thinking level controls and reasoning pill in composer`
3. `feat(advisor): add slash commands and native rpc command output handling`
4. `feat(ui): add composer toggles menu for advisor, thinking visibility, and tools`
5. `feat(keybindings): add shortcuts for expanding details and toggling thinking`
