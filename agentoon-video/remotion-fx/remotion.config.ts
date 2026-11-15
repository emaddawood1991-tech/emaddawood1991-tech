import { Config } from "@remotion/cli/config";
import * as fs from "fs";

// Sandbox/Linux: use the pre-installed headless Chromium instead of downloading one (override with REMOTION_BROWSER).
const candidates = [process.env.REMOTION_BROWSER, "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell"].filter(Boolean) as string[];
const found = candidates.find((p) => fs.existsSync(p));
if (found) Config.setBrowserExecutable(found);
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setConcurrency(2);

// Software GL for @remotion/three on machines without a GPU.
Config.setChromiumOpenGlRenderer("swangle");
