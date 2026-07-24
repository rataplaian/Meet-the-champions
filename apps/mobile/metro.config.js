const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the workspace root so changes in packages/* trigger reloads while
// preserving Expo's SDK defaults.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);

module.exports = config;
