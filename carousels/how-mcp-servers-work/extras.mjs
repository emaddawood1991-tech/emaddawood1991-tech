// Bespoke illustration: one host runs many clients; each client talks to exactly one server.
export default ({ T, line, arrowhead, MUTED, ACC, ONA }) => ({
  diagrams: {
    hostClients: () => {
      const clients = [["Client 1", 80], ["Client 2", 220], ["Client 3", 360]];
      const servers = [["Server A", "stdio · local", 80], ["Server B", "HTTP · remote", 220], ["Server C", "either transport", 360]];
      return `<svg viewBox="0 0 936 590" width="936" height="590">${arrowhead}
        <rect x="0" y="20" width="360" height="550" rx="30" fill="var(--card)" stroke="var(--line)" stroke-width="2" stroke-dasharray="10 9"/>
        ${T(180, 70, "HOST", { a: "middle", c: ACC, w: 700 })}
        ${clients.map(([l, y]) => `<rect x="40" y="${y + 20}" width="280" height="100" rx="24" fill="var(--accent)"/>${T(180, y + 80, l, { a: "middle", f: "sans", w: 800, s: 32, c: ONA })}`).join("")}
        ${clients.map(([l, y]) => `${line(330, y + 70, 586, y + 70, { w: 4 })}`).join("")}
        ${T(458, 112, "1 : 1", { a: "middle", c: MUTED, w: 700 })}
        ${servers.map(([l, s, y]) => `<rect x="596" y="${y + 20}" width="340" height="100" rx="24" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>${T(766, y + 66, l, { a: "middle", f: "sans", w: 800, s: 32 })}${T(766, y + 102, s, { a: "middle", c: MUTED })}`).join("")}
      </svg>`;
    },
  },
});
