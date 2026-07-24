const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const mobileCwd = path.join(__dirname, "..", "apps", "mobile");
const workspaceRoot = path.join(__dirname, "..");

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

function fileContainsExpoIgnore(filePath, patterns) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .some((line) => patterns.includes(line));
  } catch {
    return false;
  }
}

function isExpoDirectoryIgnored() {
  const gitResult = spawnSync("git", ["check-ignore", ".expo"], {
    cwd: mobileCwd,
    encoding: "utf8",
    shell: false,
  });

  if (gitResult.status === 0) return true;

  return (
    fileContainsExpoIgnore(path.join(mobileCwd, ".gitignore"), [
      ".expo",
      ".expo/",
    ]) ||
    fileContainsExpoIgnore(path.join(workspaceRoot, ".gitignore"), [
      "apps/mobile/.expo",
      "apps/mobile/.expo/",
      "apps/*/.expo",
      "apps/*/.expo/",
    ])
  );
}

const doctor = run(["expo-doctor"]);
writeResult(doctor);

const output = `${doctor.stdout ?? ""}\n${doctor.stderr ?? ""}`;
const workspaceReactDuplicate =
  /Found duplicates for react:/.test(output) &&
  /Found duplicates for react-dom:/.test(output) &&
  !/Missing peer dependency/.test(output) &&
  !/app config fields that may not be synced/.test(output) &&
  !/Check that packages match versions required by installed Expo SDK/.test(output) &&
  !/Check for issues with Metro config/.test(output);
const expoIgnoreWarning = /The \.expo directory is not ignored by Git/.test(output);
const expoActuallyIgnored = expoIgnoreWarning && isExpoDirectoryIgnored();
const onlyKnownDoctorIssues =
  doctor.status !== 0 &&
  workspaceReactDuplicate &&
  (!expoIgnoreWarning || expoActuallyIgnored);

if (doctor.status !== 0 && !onlyKnownDoctorIssues) {
  process.exit(doctor.status ?? 1);
}

if (onlyKnownDoctorIssues) {
  console.warn(
    "Expo doctor reported only the known monorepo React duplicate: admin uses React 18 for Next 14 while mobile uses Expo SDK 54's React 19. The mobile Metro config pins React and React Native singleton resolution to apps/mobile/node_modules for the native demo."
  );
  if (expoIgnoreWarning) {
    console.warn(
      "Expo doctor also reported .expo ignore state, but the repository ignore configuration covers apps/mobile/.expo."
    );
  }
}

const installCheck = run(["expo", "install", "--check"]);
writeResult(installCheck);
process.exit(installCheck.status ?? 1);
