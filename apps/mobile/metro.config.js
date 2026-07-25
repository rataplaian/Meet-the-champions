const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");
const mobileNodeModules = path.resolve(projectRoot, "node_modules");
const workspaceNodeModules = path.resolve(workspaceRoot, "node_modules");

const config = getDefaultConfig(projectRoot);
const defaultResolveRequest = config.resolver?.resolveRequest;

const mobileSingletons = new Set([
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "react-dom",
  "react-dom/client",
  "react-native",
  "react-native-reanimated",
  "react-native-worklets",
]);

function resolveFromMobile(moduleName) {
  return require.resolve(moduleName, { paths: [projectRoot] });
}

// Watch the workspace root so changes in packages/* trigger reloads while
// preserving Expo's SDK defaults.
config.watchFolders = Array.from(
  new Set([...(config.watchFolders ?? []), workspaceRoot]),
);

config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [mobileNodeModules, workspaceNodeModules],
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    react: path.resolve(mobileNodeModules, "react"),
    "react-dom": path.resolve(mobileNodeModules, "react-dom"),
    "react-native": path.resolve(mobileNodeModules, "react-native"),
    "react-native-reanimated": path.resolve(
      mobileNodeModules,
      "react-native-reanimated",
    ),
    "react-native-worklets": path.resolve(
      mobileNodeModules,
      "react-native-worklets",
    ),
  },
  resolveRequest(context, moduleName, platform) {
    if (mobileSingletons.has(moduleName)) {
      return {
        type: "sourceFile",
        filePath: resolveFromMobile(moduleName),
      };
    }

    if (defaultResolveRequest) {
      return defaultResolveRequest(context, moduleName, platform);
    }

    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
