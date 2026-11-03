import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import type { Layer } from "../types";
import { animStyle } from "./animate";

const resolve = (src: string) => (/^https?:/.test(src) ? src : staticFile(src));

export const LayerView: React.FC<{ layer: Layer; sceneFrames: number }> = ({ layer, sceneFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = animStyle(layer.anim, frame, fps, sceneFrames);

  const box: React.CSSProperties = {
    position: "absolute",
    left: layer.x,
    top: layer.y,
    width: layer.w,
    height: layer.h,
    opacity: a.opacity * (layer.opacity ?? 1),
    transform: `${a.transform} rotate(${layer.rotation ?? 0}deg)`,
  };

  if (layer.type === "rect") {
    return (
      <div
        style={{
          ...box,
          background: layer.fill,
          borderRadius: layer.radius,
          border: layer.stroke ? `${layer.strokeWidth ?? 1}px solid ${layer.stroke}` : undefined,
          boxSizing: "border-box",
        }}
      />
    );
  }

  if (layer.type === "image") {
    const kb = layer.kenBurns
      ? interpolate(frame, [0, sceneFrames], [layer.kenBurns.from, layer.kenBurns.to])
      : 1;
    return (
      <div style={{ ...box, overflow: "hidden", borderRadius: layer.radius }}>
        <Img
          src={resolve(layer.src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: layer.fit ?? "cover",
            transform: `scale(${kb})`,
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...box,
        fontFamily: layer.fontFamily,
        fontSize: layer.fontSize,
        fontWeight: layer.fontWeight ?? 400,
        color: layer.color,
        textAlign: layer.align ?? "left",
        lineHeight: layer.lineHeight ?? 1.15,
        letterSpacing: layer.letterSpacing,
        whiteSpace: "pre-wrap",
        display: "flex",
        alignItems: "flex-start",
      }}
    >
      <span style={{ width: "100%" }}>{layer.text}</span>
    </div>
  );
};
