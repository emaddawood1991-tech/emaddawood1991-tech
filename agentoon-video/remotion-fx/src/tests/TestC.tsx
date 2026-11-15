import React from "react";
import { NeonOutline } from "../fx/NeonOutline";
// public/robot/robot-neutral.png is the approved Agentoon robot rendered as a transparent layer (scripts/render-robot-layers.cjs); its alpha is the silhouette.
export const TestC: React.FC = () => <NeonOutline src="robot/robot-neutral.png" imgW={1200} imgH={1680} x={160} y={300} width={760} ring={7} title="NEON OUTLINE" />;
