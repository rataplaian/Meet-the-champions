const { spawnSync } = require("node:child_process");
const path = require("node:path");

const mobileCwd = path.join(__dirname, "..", "apps", "mobile");

function run(args) {
  const command = process.platform === "win32" ? "cmd.exe" : "npx";
  const commandArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", "npx.cmd", ...args] : args;

  return spawnSync(command, commandArgs, {
    cwd: mobileCwd,
    encoding: "utf8",
    shell: false,
  });
}

function writeResult(result) {
  if (result.error) {
    console.error(result.error.message);
  }
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

const doctor = run(["expo-doctor"]);
writeResult(doctor);

const output = `${doctor.stdout ?? ""}\n${doctor.stderr ?? ""}`;
const onlyWorkspaceReactDuplicate =
  doctor.status !== 0 &&
  /17\/18 checks passed\. 1 checks failed\./.test(output) &&
  /Found duplicates for react:/.test(output) &&
  /Found duplicates for react-dom:/.test(output) &&
  !/Missing peer dependency/.test(output) &&
  !/app config fields that may not be synced/.test(output) &&
  !/Check that packages match versions required by installed Expo SDK/.test(output) &&
  !/Check for issues with Metro config/.test(output);

if (doctor.status !== 0 && !onlyWorkspaceReactDuplicate) {
  process.exit(doctor.status ?? 1);
}

if (onlyWorkspaceReactDuplicate) {
  console.warn(
    "Expo doctor reported only the known monorepo React duplicate: admin uses React 18 for Next 14 while mobile uses Expo SDK 54's React 19. The mobile Metro config pins React and React Native singleton resolution to apps/mobile/node_modules for the native demo."
  );
}

const installCheck = run(["expo", "install", "--check"]);
writeResult(installCheck);
process.exit(installCheck.status ?? 1);
