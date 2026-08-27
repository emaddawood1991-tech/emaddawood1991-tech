import { AbsoluteFill } from "remotion";
import { useEntranceEffect } from "../lib/effects";
import type { EntranceEffect } from "../lib/types";

type Props = {
  text: string;
  position?: "top" | "center" | "bottom";
  effect?: EntranceEffect;
  delay?: number;
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  background?: string;
};

const positionStyle: Record<string, React.CSSProperties> = {
  top: { top: 40, bottom: "auto", alignItems: "flex-start", paddingTop: 40 },
  center: { top: 0, bottom: 0, alignItems: "center" },
  bottom: { top: "auto", bottom: 40, alignItems: "flex-end", paddingBottom: 40 },
};

export const AnimatedText: React.FC<Props> = ({
  text,
  position = "bottom",
  effect = "fadeIn",
  delay = 0,
  fontSize = 48,
  color = "#ffffff",
  fontWeight = "700",
  background = "rgba(0,0,0,0.55)",
}) => {
  const style = useEntranceEffect(effect, delay);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        display: "flex",
        flexDirection: "column",
        ...positionStyle[position],
      }}
    >
      <div
        style={{
          ...style,
          padding: "12px 32px",
          background,
          borderRadius: 8,
          margin: "0 40px",
          alignSelf: "center",
          textAlign: "center",
          fontSize,
          color,
          fontWeight,
          fontFamily: "system-ui, sans-serif",
          lineHeight: 1.3,
          maxWidth: "80%",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
