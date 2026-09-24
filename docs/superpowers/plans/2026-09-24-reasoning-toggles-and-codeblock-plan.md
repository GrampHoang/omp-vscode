# Reasoning Level, Toggles, Slash Commands, Keybindings & Code Block Overflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement reasoning level controls, a composer toggles menu, slash commands with native RPC output handling, keybindings for thinking/tools, and fix code block overflow in the OMP VS Code extension.

**Architecture:** Extend the OMP RPC client with live thinking level and slash command output events; wire a `#thinkingBtn` and `#togglesBtn` into the webview composer; support `/advisor` and `/thinking` in extension slash command routing; register VS Code keybindings and in-webview keyboard shortcuts; and harden the CSS layout against container clipping.

**Tech Stack:** TypeScript, VS Code Extension API, CSS3 Flexbox, HTML5 Webview, JSON-RPC.

**Spec:** `docs/superpowers/specs/2026-09-24-reasoning-toggles-and-codeblock-design.md`

## Global Constraints

- Each feature MUST be implemented and committed separately to local git with clear, conventional commit messages.
- Do not commit or push to remote; only local commits.
- `npm run compile` (`tsc -p tsconfig.json --noEmit`) and `npm run build` (`node esbuild.mjs`) must pass cleanly after each task.
- Modifying session thinking level must only affect the active session's primary model without altering subagent task definitions.

## Review Focus

1. **Non-reasoning model selected:** `#thinkingBtn` must display `Thinking: off` and be dimmed, not throwing errors or offering invalid levels.
2. **Narrow or short chat viewport:** Long continuous lines in code blocks must scroll horizontally within `.md-pre` without expanding `.msg` or clipping buttons.
3. **OMP command_output:** Native slash command outputs (e.g. `/advisor on` producing `Advisor enabled.`) must render as visible system messages in the chat transcript.
4. **Active thinking level synchronization:** Live `thinking_level_changed` RPC events must update `#thinkingBtn` and session state without requiring a reload.
5. **Keybinding collisions:** In-webview keyboard listeners for `Ctrl+O` and `Ctrl+Shift+T` must prevent default browser behavior when the chat view has focus.

---

### Task 1: Fix Code Block Overflow and Container Clipping in CSS

**Files:**
- Modify: `media/chat.css:73-86, 523-535`

**Interfaces:**
- Consumes: CSS flexbox rules on `.messages`, `.msg`, `.bubble`, `.md-code`, `.md-pre`
- Produces: Hardened layout preventing container expansion beyond viewport width

- [ ] **Step 1: Update CSS rules for message container and code block layout**

In `media/chat.css`:
- Ensure `.messages` has `min-width: 0; max-width: 100%;`
- Ensure `.msg` has `min-width: 0; max-width: 100%;`
- Ensure `.bubble` has `min-width: 0; max-width: 100%; overflow: hidden;`
- Update `.md-code` to `min-width: 0; max-width: 100%;`
- Update `.bubble pre, .md-pre` to include `box-sizing: border-box; max-width: 100%; overflow-x: auto; white-space: pre;`
- Update `.code-actions` to `flex-wrap: wrap; max-width: 100%;`

- [ ] **Step 2: Verify CSS build and syntax**

Run: `npm run build`
Expected: Build succeeds without errors.

- [ ] **Step 3: Commit Task 1 locally**

```bash
git add media/chat.css
git commit -m "fix(css): prevent code block overflow and clipping in narrow/short chat view"
```

---

### Task 2: Model Reasoning Level Pill and RPC Integration

**Files:**
- Modify: `src/omp/types.ts`
- Modify: `src/omp/rpcClient.ts`
- Modify: `src/omp/sessionManager.ts`
- Modify: `src/chat/chatViewProvider.ts`
- Modify: `media/chat.js`
- Modify: `media/chat.css`

**Interfaces:**
- Consumes: OMP RPC `set_thinking_level`, `cycle_thinking_level`, `thinking_level_changed`, `get_state`
- Produces: `#thinkingBtn` in composer, `pickThinkingLevel` message handling, live level updates

- [ ] **Step 1: Update types in `src/omp/types.ts`**

Add `thinkingLevel?: string` and `reasoningSupported?: boolean` to:
- `HostToWebviewMessage` (`type: "ready"` and `type: "config"`)
- `WebviewToHostMessage` (`{ type: "pickThinkingLevel" }`)
- `OmpRpcEvent` (support `type: "thinking_level_changed"`)

- [ ] **Step 2: Add thinking level methods and event forwarding to `src/omp/rpcClient.ts`**

In `src/omp/rpcClient.ts`:
- In `OmpRpcClientEvents`, add `thinkingLevelChanged: [string]`.
- In `rl.on("line")`, if `event.type === "thinking_level_changed"`, emit `thinkingLevelChanged` with `event.thinkingLevel`.
- Add `async setThinkingLevel(level: string): Promise<void>` sending `{ type: "set_thinking_level", level }`.
- Add `async cycleThinkingLevel(): Promise<string | null>` sending `{ type: "cycle_thinking_level" }`.

- [ ] **Step 3: Update `src/omp/sessionManager.ts` to manage thinking level**

In `src/omp/sessionManager.ts`:
- Add `private thinkingLevel: string | undefined;`
- In `start()`, listen to `this.client.on("thinkingLevelChanged", (level) => { this.thinkingLevel = level; this.notify(); })`.
- In `getState()` processing, capture `data.thinkingLevel`.
- Add `getThinkingLevel(): string | undefined`.
- Add `async setThinkingLevel(level: string): Promise<void>`.
- Add `isReasoningSupported(): boolean` checking the current model's reasoning capability.

- [ ] **Step 4: Update `src/chat/chatViewProvider.ts` to render and handle `#thinkingBtn`**

In `src/chat/chatViewProvider.ts`:
- In `getHtmlForWebview()`, insert `#thinkingBtn` next to `#modelBtn`:
  ```html
  <button id="thinkingBtn" class="pill" title="Thinking / reasoning level">
    <span id="thinkingLabel" class="pill-label">Thinking</span>
    <span class="chev">▾</span>
  </button>
  ```
- In `postState()` and config updates, include `thinkingLevel` and `reasoningSupported`.
- In `onDidReceiveMessage`, handle `case "pickThinkingLevel"`:
  - Show QuickPick with levels: `off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` (highlighting active).
  - Apply chosen level via `this.sessions.setThinkingLevel(level)` and update workspace config `ompChat.thinking`.

- [ ] **Step 5: Update `media/chat.js` and `media/chat.css` for `#thinkingBtn`**

In `media/chat.js`:
- Query `const thinkingBtn = document.getElementById("thinkingBtn")` and `thinkingLabel = document.getElementById("thinkingLabel")`.
- Attach click handler to post `{ type: "pickThinkingLevel" }`.
- In `renderConfig()`, update `thinkingLabel.textContent = "Thinking: " + (state.thinkingLevel || "auto")`.
- If `state.reasoningSupported === false`, add `.disabled` class and update title to `"Model does not support reasoning"`.

In `media/chat.css`:
- Add styling for `#thinkingBtn` matching existing `.pill` styles with appropriate dimming when disabled.

- [ ] **Step 6: Verify build**

Run: `npm run compile && npm run build`
Expected: Both pass cleanly.

- [ ] **Step 7: Commit Task 2 locally**

```bash
git add src/omp/types.ts src/omp/rpcClient.ts src/omp/sessionManager.ts src/chat/chatViewProvider.ts media/chat.js media/chat.css
git commit -m "feat(rpc): support thinking level controls and reasoning pill in composer"
```

---

### Task 3: Slash Commands (`/advisor`, `/thinking`) and OMP RPC `command_output` Handling

**Files:**
- Modify: `src/omp/rpcClient.ts`
- Modify: `src/omp/sessionManager.ts`
- Modify: `src/chat/chatViewProvider.ts`
- Modify: `media/chat.js`

**Interfaces:**
- Consumes: OMP RPC `command_output` events, slash command user inputs
- Produces: Inline system messages for command outputs, `/advisor` and `/thinking` slash commands

- [ ] **Step 1: Emit `command_output` in `src/omp/rpcClient.ts`**

In `src/omp/rpcClient.ts`:
- In `OmpRpcClientEvents`, add `commandOutput: [string]`.
- In `rl.on("line")`, if `event.type === "command_output" && typeof event.text === "string"`, emit `commandOutput` with `event.text`.

- [ ] **Step 2: Handle `commandOutput` in `src/omp/sessionManager.ts`**

In `src/omp/sessionManager.ts`:
- In `start()`, listen for `this.client.on("commandOutput", (text) => { ... })`.
- Add a system message `{ role: "system", parts: [{ kind: "text", text }] }` to the active session transcript so the confirmation is visible to the user.

- [ ] **Step 3: Add `/advisor` and `/thinking` commands in `src/chat/chatViewProvider.ts`**

In `src/chat/chatViewProvider.ts`:
- In `runSlashCommand`:
  - `case "advisor"`:
    - If args (`on`, `off`, `status`) provided, prompt OMP session with `/advisor ${args}`.
    - If no args, prompt user with QuickPick (`Turn Advisor On`, `Turn Advisor Off`, `Show Advisor Status`) and dispatch chosen command.
  - `case "thinking"`:
    - If args provided, call `this.sessions.setThinkingLevel(args)`.
    - If no args, call `this.pickThinkingLevelAndApply()`.

- [ ] **Step 4: Update `media/chat.js` `SLASH_COMMANDS` list**

In `media/chat.js`:
- Add `{ id: "advisor", label: "/advisor", detail: "Toggle or check advisor status (/advisor on|off|status)" }`.
- Add `{ id: "thinking", label: "/thinking", detail: "Set or pick reasoning thinking level" }`.

- [ ] **Step 5: Verify build**

Run: `npm run compile && npm run build`
Expected: Both pass cleanly.

- [ ] **Step 6: Commit Task 3 locally**

```bash
git add src/omp/rpcClient.ts src/omp/sessionManager.ts src/chat/chatViewProvider.ts media/chat.js
git commit -m "feat(advisor): add slash commands and native rpc command output handling"
```

---

### Task 4: Composer Toggles Menu Button for Advisor and Thinking Visibility

**Files:**
- Modify: `src/chat/chatViewProvider.ts`
- Modify: `media/chat.js`
- Modify: `media/chat.css`

**Interfaces:**
- Consumes: Webview message `{ type: "showTogglesMenu" }`
- Produces: `#togglesBtn` icon in composer actions, QuickPick toggle menu for Advisor and Thinking visibility

- [ ] **Step 1: Add `#togglesBtn` in `src/chat/chatViewProvider.ts`**

In `src/chat/chatViewProvider.ts`:
- In `getHtmlForWebview()`, inside `.right-actions` before or next to `#attachBtn`:
  ```html
  <button id="togglesBtn" class="icon-btn composer-icon" title="Toggles (Advisor, Thinking visibility, Expand all)">
    <svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.5 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM4.5 7a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11.5 11a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM1 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5zm0 5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5zm5 0a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5zm-5 5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5z"/>
    </svg>
  </button>
  ```
- In `onDidReceiveMessage`, handle `case "showTogglesMenu"`:
  - Display QuickPick items:
    - `👁 Advisor (${isAdvisorOn ? "Enabled" : "Disabled"})` -> toggles advisor via `/advisor on` or `/advisor off`.
    - `💭 Thinking Blocks (${showThinking ? "Visible" : "Hidden"})` -> toggles `ompChat.showThinking`.
    - `📂 Toggle Expand / Collapse All Details` -> sends `{ type: "toggleCollapseAll" }` to webview.

- [ ] **Step 2: Wire `#togglesBtn` in `media/chat.js`**

In `media/chat.js`:
- Query `const togglesBtn = document.getElementById("togglesBtn")`.
- Attach click listener to post `{ type: "showTogglesMenu" }`.
- In message listener, handle `{ type: "toggleCollapseAll" }` to toggle all `.collapse` elements open or closed.

- [ ] **Step 3: Verify build**

Run: `npm run compile && npm run build`
Expected: Passes cleanly.

- [ ] **Step 4: Commit Task 4 locally**

```bash
git add src/chat/chatViewProvider.ts media/chat.js media/chat.css
git commit -m "feat(ui): add composer toggles menu for advisor, thinking visibility, and tools"
```

---

### Task 5: Keyboard Shortcuts and In-Chat Hotkeys

**Files:**
- Modify: `package.json`
- Modify: `src/extension.ts`
- Modify: `media/chat.js`

**Interfaces:**
- Consumes: User key events (`Ctrl+O`, `Ctrl+Shift+T`), VS Code commands
- Produces: Commands `ompChat.toggleThinkingVisibility` and `ompChat.toggleCollapseAll` with keybindings

- [ ] **Step 1: Register commands and keybindings in `package.json`**

In `package.json`:
- Under `contributes.commands`:
  - `ompChat.toggleThinkingVisibility` ("OMP: Toggle Thinking Blocks Visibility")
  - `ompChat.toggleCollapseAll` ("OMP: Toggle Expand/Collapse Details")
- Under `contributes.keybindings`:
  - `command: "ompChat.toggleCollapseAll"`, key: `ctrl+o`, mac: `cmd+o`, when: `view == ompChat.sidebar`
  - `command: "ompChat.toggleThinkingVisibility"`, key: `ctrl+shift+t`, mac: `cmd+shift+t`, when: `view == ompChat.sidebar`

- [ ] **Step 2: Register command implementations in `src/extension.ts`**

In `src/extension.ts`:
- Register `ompChat.toggleCollapseAll` to delegate to `chatViewProvider.toggleCollapseAll()`.
- Register `ompChat.toggleThinkingVisibility` to toggle `ompChat.showThinking` configuration.

- [ ] **Step 3: Add in-webview keydown listener in `media/chat.js`**

In `media/chat.js`:
- Intercept `Ctrl+O` / `Cmd+O` inside the chat webview (outside inputs when appropriate, or in general) to toggle all collapsible details without triggering browser open-file dialog.
- Intercept `Ctrl+Shift+T` / `Cmd+Shift+T` to post `{ type: "toggleThinkingVisibility" }`.

- [ ] **Step 4: Verify build and compile**

Run: `npm run compile && npm run build`
Expected: Clean build without errors or warnings.

- [ ] **Step 5: Commit Task 5 locally**

```bash
git add package.json src/extension.ts media/chat.js src/chat/chatViewProvider.ts
git commit -m "feat(keybindings): add shortcuts for expanding details and toggling thinking"
```
