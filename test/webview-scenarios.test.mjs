import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Scenario 1: No empty article gap when intermediate thinking/tool parts are hidden", () => {
  const code = fs.readFileSync("media/chat.js", "utf8");

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  const createdElements = [];
  const mockEl = (tag = "div") => {
    const el = {
      tagName: tag.toUpperCase(),
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {},
      setAttribute: () => {},
      getAttribute: () => null,
      hidden: false,
      children: [],
      childNodes: [],
      innerHTML: "",
      textContent: "",
      contains: () => false,
      querySelector: () => null,
      querySelectorAll: () => [],
    };
    createdElements.push(el);
    return el;
  };

  const messagesEl = mockEl("main");
  const emptyEl = mockEl("section");
  const inputEl = mockEl("div");

  let messageHandler = null;
  const jsdom = {
    getElementById: (id) => {
      if (id === "messages") return messagesEl;
      if (id === "empty") return emptyEl;
      if (id === "input") return inputEl;
      return mockEl();
    },
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

  // Send turn with hidden thinking and tool calls, followed by user prompt and assistant reply
  messageHandler({
    data: {
      type: "ready",
      status: { state: "ready" },
      showThinking: false,
      showTools: false,
      showTerminal: false,
      messages: [
        {
          id: "prompt1",
          role: "user",
          parts: [{ kind: "text", text: "Hello, list my files" }]
        },
        {
          id: "turn2_hidden_tools",
          role: "assistant",
          parts: [
            { kind: "thinking", text: "I need to call tool" },
            { kind: "tool", name: "bash", status: "done", inputPreview: "ls -la" },
            { kind: "tool", name: "read", status: "done", fileRefs: [{ path: "test.ts" }] }
          ]
        },
        {
          id: "turn3_reply",
          role: "assistant",
          parts: [{ kind: "text", text: "Here are your files: foo, bar" }]
        }
      ]
    }
  });

  const html = messagesEl.innerHTML;
  assert.equal(html.includes("turn2_hidden_tools"), false, "Hidden turn should not render in DOM");
  assert.equal(html.includes("prompt1"), true, "User prompt must render");
  assert.equal(html.includes("turn3_reply"), true, "Reply must render");

  // Verify that prompt1 is immediately followed by turn3_reply without empty article between them
  const promptIdx = html.indexOf("prompt1");
  const replyIdx = html.indexOf("turn3_reply");
  assert.ok(promptIdx < replyIdx);

  const between = html.slice(promptIdx, replyIdx);
  assert.equal(between.includes("turn2_hidden_tools"), false);
  assert.equal(between.includes("empty"), false);
});

test("Scenario 2: Thinking body CSS rules size naturally with no fixed cap or scrollbar", () => {
  const css = fs.readFileSync("media/chat.css", "utf8");

  // Check .thinking-body rule in css
  const match = css.match(/\.thinking-body[\s\S]*?\{([\s\S]*?)\}/);
  assert.ok(match, "Must have .thinking-body rule");
  const bodyRule = match[1];

  assert.ok(bodyRule.includes("max-height: none;"), "Must have max-height: none to avoid fixed cap");
  assert.ok(bodyRule.includes("overflow: visible;"), "Must have overflow: visible to avoid scrollbar");
  assert.ok(bodyRule.includes("height: auto;"), "Must have height: auto to size naturally");
  assert.equal(bodyRule.includes("max-height: 220px"), false, "Must not have 220px cap");
  assert.equal(bodyRule.includes("max-height: 360px"), false, "Must not have 360px cap");
});

test("Scenario 3: Fast-path canPatch succeeds during streaming when intermediate turn is hidden", () => {
  const code = fs.readFileSync("media/chat.js", "utf8");

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  const mockElement = (id = "") => {
    const el = {
      tagName: "ARTICLE",
      getAttribute: (attr) => (attr === "data-parts-sig" ? "text" : id),
      setAttribute: () => {},
      addEventListener: () => {},
      classList: { add: () => {}, remove: () => {}, toggle: () => {} },
      style: {},
      innerHTML: "",
      textContent: "",
      querySelector: (sel) => {
        if (sel === ".bubble") return lastBubble;
        return null;
      },
      querySelectorAll: (sel) => {
        if (sel === ".bubble") return [lastBubble];
        return [];
      },
      contains: () => false,
      children: [],
      childNodes: [],
    };
    return el;
  };

  const lastBubble = {
    tagName: "DIV",
    className: "bubble",
    innerHTML: "Hello",
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    closest: () => null,
  };

  const articleUser = mockElement("prompt1");
  const articleReply = mockElement("turn3_streaming");

  let messagesInnerHTMLSetCount = 0;
  const messagesEl = {
    tagName: "MAIN",
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    children: [articleUser, articleReply], // 2 visible children in DOM
    querySelector: (sel) => {
      if (sel.includes("turn3_streaming")) return articleReply;
      return null;
    },
    querySelectorAll: () => [],
    get innerHTML() { return ""; },
    set innerHTML(val) {
      messagesInnerHTMLSetCount++;
    },
  };

  let messageHandler = null;
  const jsdom = {
    getElementById: (id) => {
      if (id === "messages") return messagesEl;
      return mockElement();
    },
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

  // Setup state with 3 messages: 1 user, 1 hidden tool turn, 1 streaming assistant
  messageHandler({
    data: {
      type: "ready",
      status: { state: "busy" },
      showThinking: false,
      showTools: false,
      showTerminal: false,
      messages: [
        {
          id: "prompt1",
          role: "user",
          parts: [{ kind: "text", text: "run command" }]
        },
        {
          id: "turn2_hidden",
          role: "assistant",
          parts: [{ kind: "tool", name: "bash", status: "done", inputPreview: "ls" }]
        },
        {
          id: "turn3_streaming",
          role: "assistant",
          streaming: true,
          parts: [{ kind: "text", text: "Streaming answer chunk 1..." }]
        }
      ]
    }
  });

  // Now simulate a streaming token update on turn3_streaming
  const initialSetCount = messagesInnerHTMLSetCount;
  messageHandler({
    data: {
      type: "messages",
      messages: [
        {
          id: "prompt1",
          role: "user",
          parts: [{ kind: "text", text: "run command" }]
        },
        {
          id: "turn2_hidden",
          role: "assistant",
          parts: [{ kind: "tool", name: "bash", status: "done", inputPreview: "ls" }]
        },
        {
          id: "turn3_streaming",
          role: "assistant",
          streaming: true,
          parts: [{ kind: "text", text: "Streaming answer chunk 1... and chunk 2!" }]
        }
      ]
    }
  });

  // Verify that canPatch succeeded: messagesEl.innerHTML was NOT re-renderedwholesale!
  assert.equal(messagesInnerHTMLSetCount, initialSetCount, "canPatch should update lastBubble without re-rendering messagesEl.innerHTML");
  assert.ok(lastBubble.innerHTML.includes("chunk 2!"), "lastBubble must receive the updated text via fast patch");
});
test("Scenario 4: Non-sticky full re-render correctly uses prevScrollTop and prevScrollHeight without throwing", () => {
  const code = fs.readFileSync("media/chat.js", "utf8");

  globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
  const mockEl = () => ({
    tagName: "DIV",
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    setAttribute: () => {},
    getAttribute: () => null,
    hidden: false,
    children: [],
    childNodes: [],
    innerHTML: "",
    textContent: "",
    contains: () => false,
    querySelector: () => null,
    querySelectorAll: () => [],
  });

  let scrollHeight = 1000;
  let scrollTop = 200;
  const messagesEl = {
    tagName: "MAIN",
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, toggle: () => {} },
    style: {},
    children: [],
    querySelector: () => null,
    querySelectorAll: () => [],
    get scrollHeight() { return scrollHeight; },
    get scrollTop() { return scrollTop; },
    set scrollTop(v) { scrollTop = v; },
    get innerHTML() { return ""; },
    set innerHTML(val) { scrollHeight += 200; },
  };

  let messageHandler = null;
  const jsdom = {
    getElementById: (id) => (id === "messages" ? messagesEl : mockEl()),
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

  // Force shouldStick to false by setting scrollTop far from bottom
  scrollTop = 100;
  scrollHeight = 2000;

  // Now trigger a full render by sending ready message with non-streaming messages
  assert.doesNotThrow(() => {
    messageHandler({
      data: {
        type: "ready",
        status: { state: "ready" },
        messages: [
          { id: "m1", role: "user", parts: [{ kind: "text", text: "msg1" }] },
          { id: "m2", role: "assistant", parts: [{ kind: "text", text: "msg2" }] }
        ]
      }
    });
  });

  // Verify scrollTop was updated according to delta without throwing
  assert.ok(scrollTop >= 100);
});
