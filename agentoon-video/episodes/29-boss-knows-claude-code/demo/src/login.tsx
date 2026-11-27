import React, { useState } from "react";

// DEMO ONLY: simulated authentication. No real credentials, accounts, databases or services.
export type LoginResult = { ok: boolean; user: string };
export const mockLogin = (): LoginResult => ({ ok: true, user: "demo-user" });

/** VERSION A: INTENTIONALLY BUGGY example (isolated teaching demo, never used anywhere else).
 *  The first click only arms the button; the login happens on the second click. */
export function LoginButtonBuggy({ onLogin }: { onLogin: (r: LoginResult) => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button data-testid="buggy" onClick={() => { if (!armed) { setArmed(true); return; } onLogin(mockLogin()); }}>
      Log in
    </button>
  );
}

/** VERSION B: corrected example. One click performs the (mock) login. */
export function LoginButton({ onLogin }: { onLogin: (r: LoginResult) => void }) {
  return (
    <button data-testid="fixed" onClick={() => onLogin(mockLogin())}>
      Log in
    </button>
  );
}
