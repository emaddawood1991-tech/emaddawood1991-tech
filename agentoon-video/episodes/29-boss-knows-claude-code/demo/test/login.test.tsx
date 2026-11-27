// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { LoginButton, LoginButtonBuggy } from "../src/login";

afterEach(cleanup);
describe("LoginButton (fixed)", () => {
  it("logs in on the first click", () => {
    const onLogin = vi.fn(); render(<LoginButton onLogin={onLogin} />);
    fireEvent.click(screen.getByRole("button")); expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
describe("LoginButtonBuggy (intentional bug)", () => {
  it("does nothing on the first click", () => {
    const onLogin = vi.fn(); render(<LoginButtonBuggy onLogin={onLogin} />);
    fireEvent.click(screen.getByRole("button")); expect(onLogin).not.toHaveBeenCalled();
  });
  it("logs in on the second click", () => {
    const onLogin = vi.fn(); render(<LoginButtonBuggy onLogin={onLogin} />);
    const b = screen.getByRole("button"); fireEvent.click(b); fireEvent.click(b); expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
