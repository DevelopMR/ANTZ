import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const npmCli =
  process.platform === "win32"
    ? join(
        process.env.ProgramFiles || "C:\\Program Files",
        "nodejs",
        "node_modules",
        "npm",
        "bin",
        "npm-cli.js"
      )
    : null;

const tools = [
  { label: "git", command: "git", args: ["--version"], required: true },
  { label: "node", command: "node", args: ["--version"], required: true },
  {
    label: "npm",
    command: process.execPath,
    args:
      npmCli && existsSync(npmCli)
        ? [npmCli, "--version"]
        : ["-e", "console.log(process.env.npm_version || 'unknown')"],
    required: true
  },
  { label: "gh", command: "gh", args: ["--version"], required: false },
  { label: "rg", command: "rg", args: ["--version"], required: false },
  { label: "fd", command: "fd", args: ["--version"], required: false },
  { label: "jq", command: "jq", args: ["--version"], required: false },
  { label: "bat", command: "bat", args: ["--version"], required: false }
];

let hasFailure = false;

for (const tool of tools) {
  const result = spawnSync(tool.command, tool.args, { encoding: "utf8" });

  if (result.status === 0) {
    const output = `${result.stdout || result.stderr}`.trim().split(/\r?\n/)[0];
    console.log(`[ok] ${tool.label}: ${output}`);
    continue;
  }

  if (tool.required) {
    hasFailure = true;
    console.log(`[missing] ${tool.label}: required for repo workflow`);
  } else {
    console.log(`[optional] ${tool.label}: not found`);
  }
}

if (hasFailure) {
  process.exitCode = 1;
}
