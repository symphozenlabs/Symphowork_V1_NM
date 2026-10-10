import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import LogoutButton from "./logout-button";

describe("LogoutButton component", () => {
  it("renders with aria-haspopup=dialog and label", () => {
    const html = renderToStaticMarkup(
      React.createElement(LogoutButton, null, "Log out")
    );

    expect(html).toContain("aria-haspopup=\"dialog\"");
    expect(html).toContain("Log out");
  });
});
