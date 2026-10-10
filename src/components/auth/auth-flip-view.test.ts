import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { AuthFlipView } from "./auth-flip-view";

describe("AuthFlipView component", () => {
  it("renders executive split layout with prominent logo and defaults to login face", () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthFlipView, { initialMode: "login" })
    );

    // Verifies official logo is rendered prominently
    expect(html).toContain("symphowork-logo.png");
    expect(html).toContain("alt=\"SymphoWork\"");

    // Verifies login face is present
    expect(html).toContain("Welcome back");
    expect(html).toContain("Sign in to your SymphoWork organization workspace.");
    expect(html).toContain("Create account");

    // Verifies register face is also rendered on back side
    expect(html).toContain("Create your account");
    expect(html).toContain("Sign in");
  });

  it("renders with initialMode='register' with flipped card state", () => {
    const html = renderToStaticMarkup(
      React.createElement(AuthFlipView, { initialMode: "register" })
    );

    expect(html).toContain("is-flipped");
    expect(html).toContain("Create your account");
  });
});
