/** @type {import('next').NextConfig} */
const path = require("path");
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["@meet-champion/shared"],
  webpack: (config) => {
    config.resolve.alias["@meet-champion/shared"] = path.resolve(
      __dirname, "..", "..", "packages", "shared", "src"
    );
    return config;
  },
};
