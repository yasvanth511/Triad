const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Enable package.json `exports` field resolution so that
// sub-path exports like @opentelemetry/otlp-exporter-base/browser-http resolve correctly.
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
