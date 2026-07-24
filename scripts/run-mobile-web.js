const { spawnSync } = require("node:child_process");
const path = require("node:path");

const action = process.argv[2];
const extraArgs = process.argv.slice(3);
const mobileCwd = path.join(__dirname, "..", "apps", "mobile");

const demoEnv = {
  ...process.env,
  EXPO_NO_DOTENV: "1",
  EXPO_PUBLIC_APP_MODE: "demo",
  EXPO_PUBLIC_SUPABASE_URL: "",
  EXPO_PUBLIC_SUPABASE_ANON_KEY: "",
  EXPO_PUBLIC_STRIPE_PUBLIC_KEY: "",
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: mobileCwd,
    env: demoEnv,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function npxArgs(args) {
  return process.platform === "win32"
    ? ["/d", "/s", "/c", "npx.cmd", ...args]
    : args;
}

const command = process.platform === "win32" ? "cmd.exe" : "npx";

if (action === "export") {
  run(command, npxArgs(["expo", "export", "--platform", "web", ...extraArgs]));
} else if (action === "deploy") {
  run(command, npxArgs(["expo", "export", "--platform", "web"]));
  run(
    command,
    npxArgs([
      "eas-cli@latest",
      "deploy",
      "--non-interactive",
      "--export-dir",
      "dist",
      "--dev-domain",
      "meet-the-champions-demo",
      "--alias",
      "demo",
      ...extraArgs,
    ]),
  );
} else {
  console.error("Usage: node scripts/run-mobile-web.js <export|deploy> [...args]");
  process.exit(1);
}
