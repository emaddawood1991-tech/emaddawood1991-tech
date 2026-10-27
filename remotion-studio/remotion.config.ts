/**
 * Note: When using the Node.JS APIs, the config file
 * doesn't apply. Instead, pass options directly to the APIs.
 *
 * All configuration options: https://remotion.dev/docs/config
 */

import { Config } from "@remotion/cli/config";
import { enableTailwind } from '@remotion/tailwind-v4';
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.overrideWebpackConfig(enableTailwind);

// Use pre-installed Chromium in the remote environment (avoids network download).
// The Playwright revision changes between images, so resolve the path instead of hardcoding it.
// Override with REMOTION_BROWSER_EXECUTABLE.
if (process.env.REMOTION_USE_LOCAL_CHROME === "1") {
  const browser = process.env.REMOTION_BROWSER_EXECUTABLE ?? findLocalHeadlessShell();
  if (browser) {
    Config.setBrowserExecutable(browser);
  }
}

function findLocalHeadlessShell(): string | null {
  const root = "/opt/pw-browsers";
  if (!existsSync(root)) {
    return null;
  }
  const revisions = readdirSync(root)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort()
    .reverse();
  for (const revision of revisions) {
    for (const rel of [
      "chrome-headless-shell-linux64/chrome-headless-shell",
      "chrome-linux/headless_shell",
    ]) {
      const candidate = join(root, revision, rel);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return null;
}
