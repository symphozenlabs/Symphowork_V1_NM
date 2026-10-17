import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { CustomSelect } from "./custom-select";

describe("CustomSelect component", () => {
  const testOptions = [
    { value: "dept-1", label: "Engineering (ENG)" },
    { value: "dept-2", label: "Product Operations (PROD)" },
    { value: "dept-3", label: "People & HR (HR)", disabled: true },
  ];

  it("renders trigger button with placeholder when unselected", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomSelect, {
        value: "",
        onChange: () => {},
        options: testOptions,
        placeholder: "Select a department…",
      })
    );

    expect(html).toContain("Select a department…");
    expect(html).toContain("aria-haspopup=\"listbox\"");
    expect(html).toContain("aria-expanded=\"false\"");
    expect(html).toContain("border-border");
  });

  it("renders selected option label when value is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomSelect, {
        value: "dept-2",
        onChange: () => {},
        options: testOptions,
        placeholder: "Select a department…",
      })
    );

    expect(html).toContain("Product Operations (PROD)");
    expect(html).toContain("aria-label=\"Clear selection\"");
  });

  it("renders error state when error prop is provided", () => {
    const html = renderToStaticMarkup(
      React.createElement(CustomSelect, {
        value: "",
        onChange: () => {},
        options: testOptions,
        error: "Department is required.",
      })
    );

    expect(html).toContain("border-rose-400");
    expect(html).toContain("Department is required.");
    expect(html).toContain("aria-invalid=\"true\"");
  });
});
