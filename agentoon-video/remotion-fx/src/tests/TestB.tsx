import React from "react";
import { ExplainerPanel, PanelProps } from "../fx/ExplainerPanel";

// Screenshot: cap.so hero (public/shots/cap-0.jpg, 1920x1200). Coordinates below are screenshot pixels.
const words = "Open cap dot so. Pick Instant Mode. Hit download, then record.".split(" ");
const stamps = words.map((w, i) => ({ w, s: 4 + i * 15, e: 4 + (i + 1) * 15 }));
const props: PanelProps = {
  shot: "shots/cap-0.jpg", shotW: 1920, shotH: 1200, url: "cap.so", heading: "/EXPLAINER-PANEL-REEL",
  cam: [{ f: 0, cx: 960, cy: 600, zoom: 1 }, { f: 34, cx: 800, cy: 400, zoom: 1.7 }, { f: 84, cx: 900, cy: 820, zoom: 1.6 }, { f: 130, cx: 960, cy: 600, zoom: 1.05 }],
  cursor: [{ f: 0, x: 1500, y: 160 }, { f: 32, x: 770, y: 340 }, { f: 40, x: 770, y: 340, click: true }, { f: 80, x: 905, y: 905 }, { f: 90, x: 905, y: 905, click: true }, { f: 149, x: 905, y: 905 }],
  highlights: [{ f: 30, to: 84, x: 690, y: 308, w: 190, h: 64 }, { f: 82, to: 149, x: 760, y: 870, w: 290, h: 72 }],
  callouts: [{ f: 38, to: 84, x: 770, y: 340, label: "INSTANT MODE", step: 1, side: "above" }, { f: 90, to: 149, x: 905, y: 905, label: "DOWNLOAD", step: 2, side: "above" }],
  steps: [{ title: "Open the site", detail: "cap.so", from: 0, to: 30 }, { title: "Pick Instant Mode", detail: "share link on stop", from: 30, to: 84 }, { title: "Download + record", detail: "free for Linux shown", from: 84, to: 150 }],
  words: stamps,
};
export const TestB: React.FC = () => <ExplainerPanel {...props} />;
