# Side-by-Side Extension Identity Design

**Date:** 2026-09-25  
**Status:** Approved design; awaiting written-spec review  
**Target:** `omp-vscode`

## Goal

Package this fork as an independently installable VS Code extension that can run beside the original OMP Chat extension without sharing extension contributions, settings, commands, views, or persisted extension state.

## Identity Contract

| Surface | Original | Fork |
| --- | --- | --- |
| Extension identifier | `chakyiuli.oh-my-pi-chat` | `gramphoang.oh-my-pi-chat-extend` |
| Publisher | `ChakyiuLI` | `gramphoang` |
| Package name | `oh-my-pi-chat` | `oh-my-pi-chat-extend` |
| Display name | `OMP Chat` | `GramHoang OMP Chat Extend` |
| Activity container | `ompChat` | `ompChatExtend` |
| Webview view | `ompChat.sidebar` | `ompChatExtend.sidebar` |
| Commands | `ompChat.*` | `ompChatExtend.*` |
| Settings | `ompChat.*` | `ompChatExtend.*` |

## Implementation Scope

1. Change `package.json` publisher, package name, display name, view container, view ID, command IDs, menu references, keybindings, activation events, and configuration keys.
2. Change every TypeScript and webview host call site that executes a command, reads or writes configuration, or references the view ID.
3. Change development-packaging transformations so they retain the fork identity instead of producing a competing original/development identifier.
4. Preserve existing session file behavior. OMP session files remain shared only because OMP itself owns them; extension tab/open-session persistence separates automatically by extension identifier.
5. Leave legacy `ompChat.*` settings and original extension storage unchanged. No automatic migration or fallback reads.

## Non-goals

- Publishing to Marketplace.
- Modifying the original OMP Chat extension.
- Moving or rewriting OMP-owned session files.
- Migrating existing original-extension settings.

## Failure Handling

- A missed old contribution ID is a collision risk; automated tests/search-based verification must assert no runtime `ompChat` command, configuration, view, menu, or keybinding identifier remains.
- The package build must produce an installable VSIX whose extension identifier is `gramphoang.oh-my-pi-chat-extend`.

## Verification

1. Compile and run the full test suite.
2. Package the VSIX.
3. Inspect the packaged manifest for the fork extension identifier and contribution IDs.
4. Install the VSIX without removing `chakyiuli.oh-my-pi-chat`; verify both identifiers appear in the remote extension registry.
5. Reload VS Code and invoke each extension’s Open Chat command independently.
