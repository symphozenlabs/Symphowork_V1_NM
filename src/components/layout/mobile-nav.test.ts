import { describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { MobileNav } from "./mobile-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app",
}));

describe("MobileNav component", () => {
  const items = [
    { label: "Overview", href: "/app" },
    { label: "People", href: "/app/employees" },
    { label: "Attendance", href: "/app/attendance" },
  ];

  it("renders accessible trigger button with minimum 44px touch target (size-11)", () => {
    const html = renderToStaticMarkup(
      React.createElement(MobileNav, { items, label: "Open test navigation" })
    );

    // Verifies button exists, has accessible label, and aria-expanded
    expect(html).toContain("aria-label=\"Open test navigation\"");
    expect(html).toContain("aria-expanded=\"false\"");
    // Verifies touch target requirement: size-11 (44px)
    expect(html).toContain("size-11");
  });

  it("renders with custom label or default label", () => {
    const htmlDefault = renderToStaticMarkup(
      React.createElement(MobileNav, { items })
    );
    expect(htmlDefault).toContain("aria-label=\"Open navigation\"");
  });
});
