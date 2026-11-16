import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING, theme } from "./theme";
import { clamp, easeInOutCubic, easeOutCubic, lerp, rng } from "./math";
import { TextMorph } from "./kinetic";

/** /agentoon-infographics: animated diagrams. All geometry is data; flows run on frame time. Label concept diagrams honestly (CONCEPT DIAGRAM). */
type P2 = [number, number];
const bez = (p: [P2, P2, P2, P2], t: number): P2 => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
const pathD = (p: [P2, P2, P2, P2]) => `M${p[0][0]},${p[0][1]} C${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}`;

export const FlowLine: React.FC<{ pts: [P2, P2, P2, P2]; start: number; color?: string; dots?: number; speed?: number; back?: boolean; width?: number }> = ({ pts, start, color = theme.lime, dots = 4, speed = 0.012, back = false, width = 7 }) => {
  const frame = useCurrentFrame(); const draw = easeOutCubic(clamp((frame - start) / 16)); const run = frame - start - 14;
  return (
    <g>
      <path d={pathD(pts)} fill="none" stroke="#2D3340" strokeWidth={width + 6} strokeLinecap="round" opacity={draw} />
      <path d={pathD(pts)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
      {run > 0 && Array.from({ length: dots }).map((_, i) => { let t = ((run * speed + i / dots) % 1 + 1) % 1; if (back) t = 1 - t; const [x, y] = bez(pts, t); return <circle key={i} cx={x} cy={y} r={11} fill="#fff" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />; })}
    </g>
  );
};

export type DiagramNode = { id: string; label: string; sub?: string; x: number; y: number; w?: number; color?: string; at: number };
export const NodeBox: React.FC<{ n: DiagramNode }> = ({ n }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const p = spring({ frame: frame - n.at, fps, config: SPRING.pop }); const w = n.w ?? 300, h = 150; const glow = 0.6 + 0.4 * Math.sin((frame - n.at) / 8);
  return (
    <g transform={`translate(${n.x},${n.y}) scale(${p})`} opacity={clamp(p * 2)}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={28} fill="#161A22" stroke={n.color ?? theme.lime} strokeWidth={5} style={{ filter: `drop-shadow(0 0 ${12 + glow * 12}px ${n.color ?? theme.lime})` }} />
      <text y={n.sub ? -4 : 14} textAnchor="middle" fontFamily={theme.body} fontWeight={900} fontSize={44} fill="#fff">{n.label}</text>
      {n.sub && <text y={44} textAnchor="middle" fontFamily={theme.mono} fontWeight={800} fontSize={28} fill="#9AA1AE">{n.sub}</text>}
    </g>
  );
};

/** MCP connection diagram: client -> MCP server -> tools; requests flow down (lime), results flow back (cyan). */
export const McpDiagram: React.FC<{ start?: number; client?: string; server?: string; tools?: { label: string; sub?: string }[] }> = ({ start = 0, client = "CLAUDE", server = "MCP SERVER", tools = [{ label: "GITHUB" }, { label: "FILES" }, { label: "DATABASE" }] }) => {
  const W = 1040, tx = [160, 520, 880];
  const nodes: DiagramNode[] = [{ id: "c", label: client, sub: "MCP CLIENT", x: 520, y: 140, at: start, color: theme.amber, w: 360 }, { id: "s", label: server, sub: "JSON-RPC", x: 520, y: 560, at: start + 22, color: theme.lime, w: 420 }, ...tools.map((t, i) => ({ id: "t" + i, label: t.label, sub: t.sub ?? "TOOL", x: tx[i], y: 1010, at: start + 44 + i * 8, color: theme.cyan, w: 250 }))];
  return (
    <svg width={W} height={1180} viewBox={`0 0 ${W} 1180`} style={{ overflow: "visible" }}>
      <FlowLine pts={[[520, 215], [520, 330], [520, 420], [520, 485]]} start={start + 14} color={theme.amber} />
      <FlowLine pts={[[540, 215], [540, 330], [540, 420], [540, 485]]} start={start + 20} color={theme.cyan} back dots={3} width={5} />
      {tools.map((_, i) => <FlowLine key={i} pts={[[520, 635], [520, 780], [tx[i], 800], [tx[i], 930]]} start={start + 40 + i * 8} color={theme.lime} speed={0.01 + i * 0.002} />)}
      {nodes.map((n) => <NodeBox key={n.id} n={n} />)}
    </svg>
  );
};

/** node network with pulses travelling the edges (deterministic layout). */
export const NodeNetwork: React.FC<{ count?: number; start?: number; width?: number; height?: number; seed?: number }> = ({ count = 22, start = 0, width = 1000, height = 800, seed = 7 }) => {
  const frame = useCurrentFrame(); const r = rng(seed); const nodes = Array.from({ length: count }, () => [60 + r() * (width - 120), 60 + r() * (height - 120)] as P2);
  const edges: [number, number][] = []; nodes.forEach((a, i) => { const near = nodes.map((b, j) => [j, Math.hypot(a[0] - b[0], a[1] - b[1])] as [number, number]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 2); near.forEach(([j]) => { if (!edges.some(([p, q]) => (p === i && q === j) || (p === j && q === i))) edges.push([i, j]); }); });
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {edges.map(([i, j], k) => { const a = nodes[i], b = nodes[j]; const d = clamp((frame - start - k * 1.5) / 14); const t = ((frame - start) * 0.02 + k * 0.17) % 1; return <g key={k}><line x1={a[0]} y1={a[1]} x2={lerp(a[0], b[0], d)} y2={lerp(a[1], b[1], d)} stroke="#3A4152" strokeWidth={3} />{d >= 1 && <circle cx={lerp(a[0], b[0], t)} cy={lerp(a[1], b[1], t)} r={7} fill={theme.cyan} style={{ filter: `drop-shadow(0 0 8px ${theme.cyan})` }} />}</g>; })}
      {nodes.map((n, i) => { const p = clamp((frame - start - i * 2) / 12); return <circle key={i} cx={n[0]} cy={n[1]} r={14 * easeOutCubic(p)} fill={i % 5 === 0 ? theme.lime : "#fff"} style={{ filter: "drop-shadow(0 0 10px rgba(200,240,49,.7))" }} />; })}
    </svg>
  );
};

export const Timeline: React.FC<{ events: { label: string; sub?: string }[]; start?: number; width?: number; height?: number; gap?: number }> = ({ events, start = 0, width = 900, height, gap = 24 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const hh = height ?? events.length * 200; const line = easeInOutCubic(clamp((frame - start) / (events.length * gap)));
  return (
    <div style={{ position: "relative", width, height: hh, fontFamily: theme.body }}>
      <div style={{ position: "absolute", left: 60, top: 0, width: 8, height: hh * line, background: `linear-gradient(${theme.lime}, ${theme.cyan})`, borderRadius: 4, boxShadow: `0 0 18px ${theme.lime}` }} />
      {events.map((e, i) => { const p = spring({ frame: frame - start - i * gap, fps, config: SPRING.pop }); return <div key={i} style={{ position: "absolute", left: 0, top: i * 200, transform: `translateX(${(1 - p) * 120}px)`, opacity: clamp(p * 2), display: "flex", alignItems: "center" }}><div style={{ width: 128, height: 128, borderRadius: 64, background: "#161A22", border: `6px solid ${theme.lime}`, color: "#fff", fontWeight: 900, fontSize: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 24px rgba(200,240,49,.4)` }}>{i + 1}</div><div style={{ marginLeft: 36 }}><div style={{ fontWeight: 900, fontSize: 56, color: "#fff", textTransform: "uppercase" }}>{e.label}</div>{e.sub && <div style={{ fontFamily: theme.mono, fontWeight: 700, fontSize: 30, color: "#9AA1AE", marginTop: 6 }}>{e.sub}</div>}</div></div>; })}
    </div>
  );
};

/** morphing software comparison: card A morphs into card B; name text-morphs, bars interpolate, accent colour crossfades. Values are ILLUSTRATIVE (label them). */
export const ComparisonMorph: React.FC<{ a: { name: string; color: string }; b: { name: string; color: string }; rows: { label: string; a: number; b: number }[]; start?: number; dur?: number; width?: number }> = ({ a, b, rows, start = 30, dur = 50, width = 940 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const m = easeInOutCubic(clamp((frame - start) / dur)); const enter = spring({ frame, fps, config: SPRING.pop });
  const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); const mix = (c1: string, c2: string, t: number) => `rgb(${hex(c1).map((v, i) => Math.round(lerp(v, hex(c2)[i], t))).join(",")})`; const col = mix(a.color, b.color, m);
  return (
    <div style={{ width, transform: `scale(${0.9 + 0.1 * enter})`, opacity: clamp(enter * 2), fontFamily: theme.body }}>
      <div style={{ background: "#161A22", border: `5px solid ${col}`, borderRadius: 34, padding: "34px 40px", boxShadow: `0 0 50px ${col}55` }}>
        <TextMorph a={a.name} b={b.name} start={start} dur={dur} size={74} color={a.color} colorB={b.color} />
        <div style={{ height: 10 }} />
        {rows.map((r, i) => { const v = lerp(r.a, r.b, clamp(m * 1.15 - i * 0.04)); const rowIn = easeOutCubic(clamp((frame - i * 6 - 6) / 16)); return <div key={i} style={{ margin: "26px 0", opacity: rowIn }}><div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 38, color: "#fff", marginBottom: 10, textTransform: "uppercase" }}><span>{r.label}</span><span style={{ fontFamily: theme.mono, color: col }}>{Math.round(v)}</span></div><div style={{ height: 30, background: "#222733", borderRadius: 15, overflow: "hidden" }}><div style={{ width: `${v}%`, height: "100%", background: col, borderRadius: 15, boxShadow: `0 0 18px ${col}` }} /></div></div>; })}
        <div style={{ fontFamily: theme.mono, fontWeight: 800, fontSize: 28, color: "#9AA1AE", textAlign: "center", marginTop: 8 }}>ILLUSTRATIVE VALUES · NOT MEASUREMENTS</div>
      </div>
    </div>
  );
};

export const ProcessSteps: React.FC<{ steps: string[]; start?: number; gap?: number }> = ({ steps, start = 0, gap = 20 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <svg width={940} height={steps.length * 190} style={{ overflow: "visible", fontFamily: theme.body }}>
      {steps.map((s, i) => { const p = spring({ frame: frame - start - i * gap, fps, config: SPRING.pop }); const a = clamp((frame - start - i * gap - 8) / 14); return <g key={i}>{i < steps.length - 1 && <><line x1={470} y1={i * 190 + 130} x2={470} y2={i * 190 + 130 + 50 * a} stroke={theme.lime} strokeWidth={6} strokeLinecap="round" /><polygon points={`470,${i * 190 + 190} 456,${i * 190 + 166} 484,${i * 190 + 166}`} fill={theme.lime} opacity={a} /></>}<g transform={`translate(0,${i * 190}) scale(${p})`} style={{ transformOrigin: "470px 60px" }} opacity={clamp(p * 2)}><rect width={940} height={120} rx={26} fill="#161A22" stroke={theme.lime} strokeWidth={4} /><circle cx={70} cy={60} r={36} fill={theme.lime} /><text x={70} y={76} textAnchor="middle" fontWeight={900} fontSize={46} fill="#0F1115">{i + 1}</text><text x={140} y={78} fontWeight={900} fontSize={44} fill="#fff">{s.toUpperCase()}</text></g></g>; })}
    </svg>
  );
};

/** animated arrow + callout label. */
export const AnimatedArrow: React.FC<{ from: P2; to: P2; start?: number; color?: string; label?: string }> = ({ from, to, start = 0, color = theme.amber, label }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const d = easeOutCubic(clamp((frame - start) / 16)); const mx = (from[0] + to[0]) / 2, my = Math.min(from[1], to[1]) - 90; const ang = Math.atan2(to[1] - my, to[0] - mx) * 180 / Math.PI; const p = spring({ frame: frame - start - 12, fps, config: SPRING.pop });
  return (
    <g>
      <path d={`M${from[0]},${from[1]} Q${mx},${my} ${to[0]},${to[1]}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - d} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <polygon points="0,0 -30,-15 -30,15" fill={color} opacity={d > 0.95 ? 1 : 0} transform={`translate(${to[0]},${to[1]}) rotate(${ang})`} />
      {label && <g transform={`translate(${from[0]},${from[1] - 10}) scale(${p})`}><rect x={-150} y={-56} width={300} height={56} rx={14} fill={color} /><text y={-16} textAnchor="middle" fontFamily={theme.body} fontWeight={900} fontSize={34} fill="#0F1115">{label}</text></g>}
    </g>
  );
};

/** /agentoon-data-flow: workflow where nodes appear one after another, an API path lights up with a moving highlight, and labelled data packets travel along it.
 *  `static` renders the same diagram as the ordinary input: nothing moves, nothing highlights. */
export const DataFlow: React.FC<{ start?: number; nodes: { id: string; label: string; sub?: string; x: number; y: number; color?: string }[]; edges: { from: string; to: string; packet?: string }[]; highlight?: string[]; static?: boolean }> = ({ start = 0, nodes, edges, highlight = [], static: st }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const find = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <svg width={1040} height={1180} viewBox="0 0 1040 1180" style={{ overflow: "visible", fontFamily: theme.body }}>
      {edges.map((e, i) => {
        const a = find(e.from), b = find(e.to); const my = (a.y + b.y) / 2; const pts: [P2, P2, P2, P2] = [[a.x, a.y + 75], [a.x, my], [b.x, my], [b.x, b.y - 75]]; const on = highlight.includes(e.from + ">" + e.to);
        if (st) return <path key={i} d={pathD(pts)} fill="none" stroke="#4A5262" strokeWidth={6} strokeDasharray="4 12" strokeLinecap="round" />;
        const at = start + 24 + i * 22, draw = easeOutCubic(clamp((frame - at) / 16)), run = frame - at - 14; const t = ((run * 0.014) % 1 + 1) % 1; const [px, py] = bez(pts, t);
        return (
          <g key={i}>
            <path d={pathD(pts)} fill="none" stroke="#2D3340" strokeWidth={14} strokeLinecap="round" opacity={draw} />
            <path d={pathD(pts)} fill="none" stroke={on ? theme.amber : theme.lime} strokeWidth={on ? 11 : 7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 ${on ? 16 : 8}px ${on ? theme.amber : theme.lime})` }} />
            {on && run > 0 && <path d={pathD(pts)} fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="0.08 0.92" strokeDashoffset={-((run * 0.02) % 1)} opacity={0.9} />}
            {run > 0 && e.packet && <g transform={`translate(${px},${py})`}><rect x={-44} y={-20} width={88} height={40} rx={10} fill="#fff" /><text y={9} textAnchor="middle" fontFamily={theme.mono} fontWeight={800} fontSize={26} fill="#0F1115">{e.packet}</text></g>}
          </g>
        );
      })}
      {nodes.map((n, i) => { const p = st ? 1 : spring({ frame: frame - (start + i * 18), fps, config: SPRING.pop }); const col = st ? "#6B7280" : n.color ?? theme.lime; return (
        <g key={n.id} transform={`translate(${n.x},${n.y}) scale(${p})`} opacity={clamp(p * 2)}>
          <rect x={-150} y={-75} width={300} height={150} rx={28} fill="#161A22" stroke={col} strokeWidth={5} style={{ filter: st ? "none" : `drop-shadow(0 0 14px ${col})` }} />
          <text y={n.sub ? -2 : 14} textAnchor="middle" fontWeight={900} fontSize={44} fill={st ? "#C5CAD3" : "#fff"}>{n.label}</text>{n.sub && <text y={46} textAnchor="middle" fontFamily={theme.mono} fontWeight={800} fontSize={28} fill="#9AA1AE">{n.sub}</text>}
        </g>); })}
    </svg>
  );
};
