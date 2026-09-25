import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

// 1. Backup original files
copyFileSync("package.json", "package.json.bak");
copyFileSync("src/chat/chatViewProvider.ts", "src/chat/chatViewProvider.ts.bak");
copyFileSync("src/extension.ts", "src/extension.ts.bak");

try {
  // 2. Read package.json and replace identities
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  pkg.name = "oh-my-pi-chat-extend-dev";
  pkg.displayName = "GramHoang OMP Chat Extend (Dev Preview)";
  pkg.publisher = "localdev";

  let pStr = JSON.stringify(pkg, null, 2);
  pStr = pStr.replace(/ompChatExtend\.sidebar/g, "ompChatExtendDev.sidebar");
  pStr = pStr.replace(/"ompChatExtend": \[/g, '"ompChatExtendDev": [');
  pStr = pStr.replace(/"id": "ompChatExtend"/g, '"id": "ompChatExtendDev"');
  pStr = pStr.replace(/"title": "OMP"/g, '"title": "OMP Dev"');
  writeFileSync("package.json", pStr);

  // 3. Patch viewType and focus commands in source files
  let cvp = readFileSync("src/chat/chatViewProvider.ts", "utf8");
  cvp = cvp.replace(/ompChatExtend\.sidebar/g, "ompChatExtendDev.sidebar");
  writeFileSync("src/chat/chatViewProvider.ts", cvp);

  let ext = readFileSync("src/extension.ts", "utf8");
  ext = ext.replace(/ompChatExtend\.sidebar/g, "ompChatExtendDev.sidebar");
  writeFileSync("src/extension.ts", ext);

  // 4. Build and package
  console.log("Building development preview package...");
  execSync("npm run build", { stdio: "inherit" });
  execSync("npx vsce package --no-dependencies --allow-missing-repository -o oh-my-pi-chat-extend-dev.vsix", { stdio: "inherit" });
  console.log("Successfully created oh-my-pi-chat-extend-dev.vsix!");
} finally {
  // 5. Restore original files and restore clean build
  copyFileSync("package.json.bak", "package.json");
  copyFileSync("src/chat/chatViewProvider.ts.bak", "src/chat/chatViewProvider.ts");
  copyFileSync("src/extension.ts.bak", "src/extension.ts");
  execSync("rm -f package.json.bak src/chat/chatViewProvider.ts.bak src/extension.ts.bak");
  execSync("npm run build", { stdio: "ignore" });
}
