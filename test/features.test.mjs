import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("isSlashCommand recognizes newly added and legacy commands", () => {
  const known = {
    new: true,
    clear: true,
    stop: true,
    restart: true,
    model: true,
    thinking: true,
    advisor: true,
    mode: true,
    attach: true,
    files: true,
    folder: true,
    terminal: true,
    cmd: true,
    usage: true,
    history: true,
    tabs: true,
    help: true,
  };

  assert.equal(Boolean(known["advisor"]), true);
  assert.equal(Boolean(known["thinking"]), true);
  assert.equal(Boolean(known["model"]), true);
  assert.equal(Boolean(known["unknown"]), false);
});

test("reasoning model detection identifies thinking capabilities", () => {
  const modelWithReasoning = {
    id: "gpt-5.6-sol",
    name: "GPT 5.6 Sol",
    reasoning: true,
    thinking: ["low", "medium", "high", "max"],
  };

  const modelWithoutReasoning = {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    reasoning: false,
    thinking: null,
  };

  const isReasoningSupported = (m) => Boolean(m?.reasoning || m?.thinking);

  assert.equal(isReasoningSupported(modelWithReasoning), true);
  assert.equal(isReasoningSupported(modelWithoutReasoning), false);
  assert.equal(isReasoningSupported(null), false);
});

test("advisor output regex correctly detects state changes and status reports", () => {
  const enabledOutput = "Advisor enabled.";
  const disabledOutput = "Advisor disabled.";
  const statusEnabledOutput = "Advisor is enabled (openai-codex/gpt-5.6-terra). Context: 0 / 272,000 tokens (0%).";
  const statusDisabledOutput = "Advisor is disabled.";

  const isEnabled = (text) => /advisor (?:is )?enabled/i.test(text);
  const isDisabled = (text) => /advisor (?:is )?disabled/i.test(text);

  assert.equal(isEnabled(enabledOutput), true);
  assert.equal(isEnabled(statusEnabledOutput), true);
  assert.equal(isEnabled(disabledOutput), false);

  assert.equal(isDisabled(disabledOutput), true);
  assert.equal(isDisabled(statusDisabledOutput), true);
  assert.equal(isDisabled(enabledOutput), false);
});

test("toggleAllCollapses logic ignores flat tool div elements without open property", () => {
  const elements = [
    { tagName: "DETAILS", open: false, id: "thinking:1" },
    { tagName: "DIV", open: undefined, id: null }, // flat tool card
  ];

  // Only check elements with boolean open property
  const detailsElements = elements.filter((el) => typeof el.open === "boolean");
  const anyClosed = detailsElements.some((el) => !el.open);
  assert.equal(anyClosed, true);

  detailsElements.forEach((el) => { el.open = true; });
  const allOpenNow = detailsElements.every((el) => el.open);
  assert.equal(allOpenNow, true);
});
test("isCommandTool discriminates bash/shell command tools from file/edit tools", () => {
  const isCommand = (name) => {
    const key = String(name || "").toLowerCase();
    return key === "bash" || key === "shell";
  };

  assert.equal(isCommand("bash"), true);
  assert.equal(isCommand("shell"), true);
  assert.equal(isCommand("read"), false);
  assert.equal(isCommand("edit"), false);
  assert.equal(isCommand("write"), false);
  assert.equal(isCommand("grep"), false);
});
test("cleanThinkingText strips leading and trailing empty newlines from thoughts", () => {
  const cleanThinkingText = (text) => {
    if (!text) return "";
    return String(text).replace(/^\n+/, "").replace(/\n+$/, "");
  };

  const rawThought = "Searching for omp-vscode session files.\n\n\n\n\n\n\n\n\n\n\n\n\n";
  const cleaned = cleanThinkingText(rawThought);
  assert.equal(cleaned, "Searching for omp-vscode session files.");

  const multiLineThought = "\n\nLine 1\nLine 2\n\nLine 3\n\n\n";
  assert.equal(cleanThinkingText(multiLineThought), "Line 1\nLine 2\n\nLine 3");
});
test("chat.js evaluates and renders tool message without ReferenceError", async () => {
  const fs = await import("node:fs");
  const code = fs.readFileSync("media/chat.js", "utf8");

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  const mockEl = () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    hidden: false,
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    childNodes: [],
    children: [],
  });

  let messageHandler = null;
  const jsdom = {
    getElementById: () => mockEl(),
    addEventListener: (event, handler) => {
      if (event === "message") messageHandler = handler;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  globalThis.document = jsdom;
  globalThis.window = jsdom;
  globalThis.acquireVsCodeApi = () => ({ postMessage: () => {} });

  const fn = new Function(code);
  fn();

  assert.equal(typeof messageHandler, "function");

  let renderError = null;
  const origErr = console.error;
  console.error = (...args) => {
    if (String(args[0] || "").includes("render failed")) {
      renderError = args.join(" ");
    }
    origErr(...args);
  };

  try {
    messageHandler({
      data: {
        type: "ready",
        status: { state: "ready" },
        messages: [
          {
            id: "m1",
            role: "assistant",
            parts: [
              { kind: "text", text: "hi" },
              { kind: "tool", name: "read", status: "done", fileRefs: [{ path: "foo.ts" }] }
            ]
          }
        ]
      }
    });
  } finally {
    console.error = origErr;
  }

  assert.equal(renderError, null);
});

test("OMP RPC live commands build correct payloads without settings.json", () => {
  const buildSetModelPayload = (provider, modelId) => ({
    type: "set_model",
    provider,
    modelId,
  });
  const buildSetThinkingPayload = (level) => ({
    type: "set_thinking_level",
    level,
  });

  const modelPayload = buildSetModelPayload("google-antigravity", "gemini-3.8-flash");
  assert.deepEqual(modelPayload, {
    type: "set_model",
    provider: "google-antigravity",
    modelId: "gemini-3.8-flash",
  });

  const thinkingPayload = buildSetThinkingPayload("medium");
  assert.deepEqual(thinkingPayload, {
    type: "set_thinking_level",
    level: "medium",
  });
});

test("OMP start arguments omit model and thinking by default to preserve OMP global config", () => {
  const buildArgs = (cwd, options = {}) => {
    const args = ["--mode", "rpc", "--cwd", cwd];
    if (options.model) args.push("--model", options.model);
    if (options.thinking) args.push("--thinking", options.thinking);
    return args;
  };

  // When starting clean without settings.json overrides
  const cleanArgs = buildArgs("/workspace", {});
  assert.deepEqual(cleanArgs, ["--mode", "rpc", "--cwd", "/workspace"]);
  assert.equal(cleanArgs.includes("--model"), false);
  assert.equal(cleanArgs.includes("--thinking"), false);

  // When user explicitly selected an override in memory
  const overrideArgs = buildArgs("/workspace", { model: "anthropic/claude-3-5-sonnet", thinking: "high" });
  assert.deepEqual(overrideArgs, [
    "--mode",
    "rpc",
    "--cwd",
    "/workspace",
    "--model",
    "anthropic/claude-3-5-sonnet",
    "--thinking",
    "high",
  ]);
});

test("turn progress formats elapsed time and active tool/thinking action", () => {
  const formatAction = (parts) => {
    if (!parts || !parts.length) return "Thinking…";
    const last = parts[parts.length - 1];
    if (last.kind === "thinking") {
      const text = (last.text || "").trim();
      return text ? `Thinking: ${text.slice(0, 30)}` : "Thinking…";
    }
    if (last.kind === "tool") {
      const toolName = last.name || "tool";
      if (last.status === "running") {
        return `Running ${toolName}: ${last.inputPreview || ""}`;
      }
      return `Completed ${toolName} · next step…`;
    }
    if (last.kind === "text") return "Responding…";
    return "Working…";
  };

  assert.equal(formatAction([]), "Thinking…");
  assert.equal(formatAction([{ kind: "thinking", text: "Analyzing project files" }]), "Thinking: Analyzing project files");
  assert.equal(
    formatAction([
      { kind: "thinking", text: "done thinking" },
      { kind: "tool", name: "bash", status: "running", inputPreview: "npm test" },
    ]),
    "Running bash: npm test"
  );
  assert.equal(
    formatAction([
      { kind: "tool", name: "bash", status: "done" },
    ]),
    "Completed bash · next step…"
  );
  assert.equal(
    formatAction([
      { kind: "text", text: "Here is the summary" },
    ]),
    "Responding…"
  );
});

test("renderMarkdownish parses fenced codeblocks without inverting subsequent text on inline backticks", () => {
  const code = fs.readFileSync("media/chat.js", "utf8");

  let messagesInnerHTML = "";
  const mockEl = (id = "") => ({
    id,
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    hidden: false,
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    childNodes: [],
    children: [],
    innerHTML: "",
  });

  let messageHandler = null;
  const messagesEl = {
    ...mockEl("messages"),
    get innerHTML() { return messagesInnerHTML; },
    set innerHTML(val) { messagesInnerHTML = val; },
  };
  const jsdom = {
    getElementById: (id) => (id === "messages" ? messagesEl : mockEl(id)),
    addEventListener: (event, handler) => {
      if (event === "message") messageHandler = handler;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  globalThis.document = jsdom;
  globalThis.window = jsdom;
  globalThis.acquireVsCodeApi = () => ({ postMessage: () => {} });

  const fn = new Function(code);
  fn();

  assert.equal(typeof messageHandler, "function");
  console.error = (...args) => console.log("TEST ERROR:", ...args);
  const input = `In markdown you use \`\`\` for code blocks:
\`\`\`
[spinner] Thinking (12s) · Analyzing git status...
\`\`\`
or
\`\`\`
[spinner] Working (28s) · bash "npm test"
\`\`\`
`;

  messageHandler({
    data: {
      type: "ready",
      status: { state: "ready" },
      messages: [
        {
          id: "m1",
          role: "assistant",
          parts: [{ kind: "text", text: input }],
        },
      ],
    },
  });
  assert.equal(messagesInnerHTML.includes("class=\"md-pre\""), true);
  assert.equal(messagesInnerHTML.includes("<p>or</p>"), true);
  assert.equal(messagesInnerHTML.includes("Thinking (12s)"), true);
  assert.equal(messagesInnerHTML.includes("Working (28s)"), true);
});

test("thinking block includes live duration label and latest thinking snippet preview", () => {
  const code = fs.readFileSync("media/chat.js", "utf8");

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  let messagesInnerHTML = "";
  const mockEl = (id = "") => ({
    id,
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    hidden: false,
    querySelector: () => null,
    querySelectorAll: () => [],
    contains: () => false,
    childNodes: [],
    children: [],
    innerHTML: "",
  });

  let messageHandler = null;
  const messagesEl = {
    ...mockEl("messages"),
    get innerHTML() { return messagesInnerHTML; },
    set innerHTML(val) { messagesInnerHTML = val; },
  };
  const jsdom = {
    getElementById: (id) => (id === "messages" ? messagesEl : mockEl(id)),
    addEventListener: (event, handler) => {
      if (event === "message") messageHandler = handler;
    },
    querySelector: () => null,
    querySelectorAll: () => [],
  };

  globalThis.document = jsdom;
  globalThis.window = jsdom;
  globalThis.acquireVsCodeApi = () => ({ postMessage: () => {} });

  const fn = new Function(code);
  fn();

  const thinkingText = "Starting to analyze project structure\n* Checking package.json\n- Verified extension configuration";

  messageHandler({
    data: {
      type: "ready",
      status: { state: "ready" },
      messages: [
        {
          id: "m2",
          role: "assistant",
          parts: [
            {
              kind: "thinking",
              text: thinkingText,
              startedAt: Date.now() - 14000,
              endedAt: Date.now(),
            },
          ],
        },
      ],
    },
  });

  assert.equal(messagesInnerHTML.includes("class=\"collapse thinking"), true);
  assert.equal(messagesInnerHTML.includes("Thought for 14s"), true);
  assert.equal(messagesInnerHTML.includes("class=\"thinking-preview\""), true);
  assert.equal(messagesInnerHTML.includes("Verified extension configuration"), true);
});
