import React from "react";
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

export type Commit = {hash: string; msg: string; img: string; at: number; tag?: string};
export type TimelineProps = {
  label: string;
  commits: Commit[];
  /** HEAD starts on the newest commit; each move glides HEAD to commits[to] at second `at` */
  headMoves: {to: number; at: number}[];
  dur: number;
};

const ORANGE = "#F05032";
const VIOLET = "#A78BFA";
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const Timeline: React.FC<TimelineProps> = ({label, commits, headMoves}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const n = commits.length;
  const x0 = 120, x1 = 880, y = 395;
  const xs = commits.map((_, i) => (n === 1 ? (x0 + x1) / 2 : x0 + (i * (x1 - x0)) / (n - 1)));

  // which commit is HEAD at time t (continuous position for a glide)
  const newest = commits.reduce((a, c, i) => (t >= c.at ? i : a), 0);
  let headPos = newest;
  let from = newest;
  headMoves.forEach((m) => {
    if (t >= m.at) {
      const k = spring({frame: frame - Math.round(m.at * fps), fps, config: {damping: 14, stiffness: 120}});
      headPos = from + (m.to - from) * k;
      from = m.to;
    }
  });
  const headIdx = Math.round(headPos);
  const headX = interpolate(headPos, [0, Math.max(1, n - 1)], [xs[0], xs[n - 1]], {extrapolateRight: "extend"});

  const sway = Math.sin(t * 0.9);
  const drawn = (i: number) => spring({frame: frame - Math.round(commits[i].at * fps), fps, config: {damping: 12, stiffness: 140}});

  return (
    <AbsoluteFill style={{background: "linear-gradient(160deg,#241455 0%,#120a33 60%,#0a0620 100%)", borderRadius: 28, overflow: "hidden"}}>
      <AbsoluteFill style={{backgroundImage: "linear-gradient(rgba(167,139,250,.10) 2px,transparent 2px),linear-gradient(90deg,rgba(167,139,250,.10) 2px,transparent 2px)", backgroundSize: "80px 80px", backgroundPosition: `${t * 24}px ${t * 12}px`}} />
      <div style={{position: "absolute", left: 36, top: 26, fontFamily: MONO, fontWeight: 800, fontSize: 24, letterSpacing: 2, color: "#FFE08A"}}>{label}</div>
      <div style={{position: "absolute", inset: 0, transform: `perspective(1500px) rotateX(${7 + sway * 1.5}deg) rotateY(${-5 + sway * 2}deg)`, transformOrigin: "50% 70%"}}>
        {/* the line draws up to the newest commit */}
        <div style={{position: "absolute", left: xs[0], top: y - 3, height: 6, borderRadius: 3, background: `linear-gradient(90deg,${ORANGE},#FF9F7A)`, width: Math.max(0, (xs[newest] - xs[0]) * Math.min(1, drawn(newest)))}} />
        {commits.map((c, i) => {
          const k = Math.min(1.15, drawn(i));
          const active = i === headIdx;
          const dim = i > headIdx && headMoves.length && t >= headMoves[0].at;
          const lift = active ? -10 : 0;
          return (
            <div key={c.hash + i} style={{position: "absolute", left: xs[i] - 85, top: 0, width: 170, opacity: Math.min(1, k) * (dim ? 0.38 : 1), transform: `scale(${0.4 + 0.6 * Math.min(1, k)})`, transformOrigin: "50% 80%"}}>
              <div style={{position: "absolute", left: 10, top: 108 + lift, width: 150, height: 170, borderRadius: 16, overflow: "hidden", border: `3px solid ${active ? "#FFC83D" : "rgba(255,255,255,.35)"}`, boxShadow: active ? "0 0 46px rgba(255,200,61,.75)" : "0 14px 30px rgba(0,0,0,.55)", background: "#1b120d"}}>
                <Img src={staticFile(c.img)} style={{width: 150, height: 170, objectFit: "cover", objectPosition: "50% 0%"}} />
              </div>
              <div style={{position: "absolute", left: 63, top: y - 22, width: 44, height: 44, borderRadius: 22, background: active ? "#FFC83D" : ORANGE, border: "5px solid #fff", boxShadow: `0 0 26px ${active ? "rgba(255,200,61,.9)" : "rgba(240,80,50,.8)"}`}} />
              <div style={{position: "absolute", left: 0, width: 170, top: y + 36, textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: 24, color: "#FFB199"}}>{c.hash}</div>
              <div style={{position: "absolute", left: -12, width: 194, top: y + 70, textAlign: "center", fontFamily: "Inter, system-ui, sans-serif", fontWeight: 800, fontSize: 21, lineHeight: 1.15, color: "#fff"}}>{c.msg}</div>
              {c.tag && <div style={{position: "absolute", left: 0, width: 170, top: y + 128, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 17, color: VIOLET}}>{c.tag}</div>}
            </div>
          );
        })}
        {/* HEAD marker glides between commits */}
        <div style={{position: "absolute", left: headX - 52, top: 70, width: 104, textAlign: "center", opacity: t > commits[0].at ? 1 : 0}}>
          <div style={{display: "inline-block", padding: "6px 18px 8px", borderRadius: 999, background: VIOLET, color: "#1A0F3A", fontFamily: MONO, fontWeight: 900, fontSize: 24}}>HEAD</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
