import { spawnSync } from "node:child_process";

const commands = [
  ["GitHub Auth", ["auth", "status"]],
  ["Pull Request Status", ["pr", "status"]]
];

for (const [label, args] of commands) {
  console.log(`\n== ${label} ==`);

  const result = spawnSync("gh", args, { encoding: "utf8" });

  if (result.error) {
    console.error(`Failed to run gh ${args.join(" ")}: ${result.error.message}`);
    process.exitCode = 1;
    continue;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}
