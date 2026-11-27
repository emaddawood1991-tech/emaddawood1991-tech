import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { LoginButton, LoginButtonBuggy, LoginResult } from "./login";

const Panel = ({ title, tag, color, Btn }: { title: string; tag: string; color: string; Btn: typeof LoginButton }) => {
  const [clicks, setClicks] = useState(0); const [status, setStatus] = useState("waiting");
  return (
    <div style={{ flex: 1, margin: 14, padding: 22, borderRadius: 22, border: `4px solid ${color}`, background: "#0d1421", color: "#f4f7fb", fontFamily: "Inter, DejaVu Sans, Arial", textAlign: "center" }}
      onClickCapture={(e) => { if ((e.target as HTMLElement).tagName === "BUTTON") setClicks((c) => c + 1); }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{title}</div>
      <div style={{ fontSize: 15, color: "#9aa7bd", marginBottom: 18 }}>{tag}</div>
      <Btn onLogin={(r: LoginResult) => setStatus(`success: ${r.user}`)} />
      <div id="clicks" style={{ fontSize: 56, fontWeight: 900, marginTop: 18 }}>{clicks}<span style={{ fontSize: 20 }}> {clicks === 1 ? "CLICK" : "CLICKS"}</span></div>
      <div id="status" style={{ fontSize: 22, fontWeight: 800, color: status.startsWith("success") ? "#3ddc97" : "#ff9a3c" }}>{status}</div>
    </div>
  );
};
createRoot(document.getElementById("root")!).render(
  <div style={{ display: "flex", flexDirection: "column", padding: 10 }}>
    <div style={{ textAlign: "center", color: "#ffb454", fontFamily: "Inter, DejaVu Sans, Arial", fontWeight: 800, fontSize: 15, letterSpacing: 2 }}>LOCAL TEACHING DEMO · SIMULATED LOGIN · NOT PRODUCTION CODE</div>
    <Panel title="VERSION B · FIXED" tag="one click logs in" color="#3ddc97" Btn={LoginButton} />
    <Panel title="VERSION A · INTENTIONALLY BUGGY" tag="needs two clicks" color="#ff5d6c" Btn={LoginButtonBuggy} />
  </div>
);
