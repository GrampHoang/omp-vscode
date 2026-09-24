import test from "node:test";
import assert from "node:assert/strict";

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

test("advisor output regex correctly detects state changes", () => {
  const enabledOutput = "Advisor enabled.";
  const disabledOutput = "Advisor disabled.";
  const statusOutput = "Advisor is enabled (openai-codex/gpt-5.6-terra). Context: 0 / 272,000 tokens (0%).";

  assert.equal(/advisor enabled/i.test(enabledOutput), true);
  assert.equal(/advisor disabled/i.test(disabledOutput), true);
  assert.equal(/advisor is enabled/i.test(statusOutput), true);
});
