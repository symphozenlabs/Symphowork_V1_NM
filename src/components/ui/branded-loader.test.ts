import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { BrandedLoader } from "./branded-loader";

describe("BrandedLoader component", () => {
  it("renders with official SymphoWork symbol asset and default message", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandedLoader)
    );

    expect(html).toContain("symphowork-symbol.png");
    expect(html).toContain("Loading your workspace...");
    expect(html).toContain("role=\"status\"");
    expect(html).toContain("aria-live=\"polite\"");
    expect(html).toContain("motion-reduce:hidden");
  });

  it("renders custom message and subtext", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandedLoader, {
        message: "Loading workforce directory...",
        subtext: "Fetching active team roster and security roles",
      })
    );

    expect(html).toContain("Loading workforce directory...");
    expect(html).toContain("Fetching active team roster and security roles");
  });

  it("renders inline pill variant", () => {
    const html = renderToStaticMarkup(
      React.createElement(BrandedLoader, {
        inline: true,
        message: "Loading payroll...",
      })
    );

    expect(html).toContain("symphowork-symbol.png");
    expect(html).toContain("Loading payroll...");
    expect(html).toContain("rounded-full");
    expect(html).toContain("bg-emerald-50/70");
  });
});
