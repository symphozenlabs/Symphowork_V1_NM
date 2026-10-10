import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { Reveal } from "./reveal";

describe("Reveal component", () => {
  it("renders children with accessible markup and transition classes", () => {
    const html = renderToStaticMarkup(
      React.createElement(
        Reveal,
        { className: "custom-class" },
        React.createElement("p", null, "Motion content")
      )
    );

    expect(html).toContain("Motion content");
    expect(html).toContain("custom-class");
    expect(html).toContain("motion-reduce:opacity-100");
  });
});
