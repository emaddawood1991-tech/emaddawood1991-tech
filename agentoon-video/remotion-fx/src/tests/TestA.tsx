import React from "react";
import { ScrapbookCollage, CollageItem } from "../fx/ScrapbookCollage";

const items: CollageItem[] = [
  { id: "cap", kind: "shot", src: "shots/cap-0.jpg", x: 40, y: 430, w: 640, rot: -4, depth: 0.35, delay: 6, from: "left", tape: true, zoom: { to: 1.25, ox: 50, oy: 35 } },
  { id: "seo", kind: "shot", src: "shots/openseo-0.jpg", x: 400, y: 650, w: 640, rot: 3, depth: 0.55, delay: 12, from: "right", tape: true, zoom: { to: 1.3, ox: 50, oy: 80 } },
  { id: "flowy", kind: "shot", src: "shots/appflowy-0.jpg", x: 36, y: 980, w: 560, rot: 2.5, depth: 0.5, delay: 18, from: "left", zoom: { to: 1.3, ox: 40, oy: 85 } },
  { id: "whispr", kind: "shot", src: "shots/openwhispr-1.jpg", x: 470, y: 1170, w: 580, rot: -3, depth: 0.8, delay: 24, from: "right", tape: true, zoom: { to: 1.25, ox: 50, oy: 45 } },
  { id: "bot", kind: "cutout", src: "robot/robot-neutral.png", x: 20, y: 1190, w: 470, rot: -4, depth: 1.0, delay: 34, from: "bottom" },
  { id: "logo1", kind: "logo", src: "logos/cap.png", x: 880, y: 150, w: 150, rot: 9, depth: 0.9, delay: 40, from: "top" },
  { id: "logo2", kind: "logo", src: "logos/openwhispr.svg", x: 900, y: 1010, w: 120, rot: -8, depth: 0.9, delay: 46, from: "top" },
  { id: "note1", kind: "note", text: "REAL SCREENSHOTS", x: 560, y: 1610, w: 420, rot: -3, depth: 0.95, delay: 52, from: "right" },
  { id: "note2", kind: "note", text: "TEST A · SCRAPBOOK", x: 560, y: 1730, w: 420, rot: 2, depth: 0.7, delay: 60, from: "left", accent: "#FFB23E" },
];
export const TestA: React.FC = () => <ScrapbookCollage items={items} kicker="/SCRAPBOOK-COLLAGE" titleWords={["REAL", "TOOLS", "COLLAGE"]} highlightWord={1} titleDelay={6} titleY={120} />;
