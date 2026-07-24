const { spawn } = require("node:child_process");

const mode = process.argv[2];
const workspaceScript = process.argv[3] || "start";
const extraArgs = process.argv.slice(4);
const validModes = new Set(["demo", "development", "production"]);

if (!validModes.has(mode)) {
  console.error(
    "Usage: node scripts/run-mobile.js <demo|development|production> <script> [...args]",
  );
  process.exit(1);
}

const npmArgs = [
  "--workspace",
  "@meet-champion/mobile",
  "run",
  workspaceScript,
  "--",
  ...extraArgs,
];
const command = process.platform === "win32" ? "cmd.exe" : "npm";
const commandArgs =
  process.platform === "win32" ? ["/d", "/s", "/c", "npm.cmd", ...npmArgs] : npmArgs;

const child = spawn(
  command,
  commandArgs,
  {
    stdio: "inherit",
    shell: false,
    env: {
      ...process.env,
      EXPO_PUBLIC_APP_MODE: mode,
    },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`mobile ${workspaceScript} stopped by ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 0);
});
