import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, open }: { children: React.ReactNode; open?: boolean }) =>
    open ? React.createElement("div", { "data-testid": "dialog-root" }, children) : null,
  Portal: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dialog-portal" }, children),
  Overlay: (props: Record<string, unknown>) =>
    React.createElement("div", { "data-testid": "dialog-overlay", ...props }),
  Content: ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "dialog-content", ...props }, children),
  Title: ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement("h2", props, children),
  Close: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  Trigger: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}));

import { LogoutConfirmDialog } from "./logout-confirm-dialog";

describe("LogoutConfirmDialog component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with title, prompt message, destination description, Cancel, and Confirm buttons", () => {
    const html = renderToStaticMarkup(
      React.createElement(LogoutConfirmDialog, {
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    // Verify Title
    expect(html).toContain("Confirm Logout");

    // Verify Prompt Message
    expect(html).toContain("Are you sure you want to log out of SymphoWork?");

    // Verify Supporting Destination Text
    expect(html).toContain("You will be returned to the SymphoWork landing page.");

    // Verify Action Buttons
    expect(html).toContain("Cancel");
    expect(html).toContain("Confirm Logout");
  });

  it("does not render dialog content when open is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(LogoutConfirmDialog, {
        open: false,
        onOpenChange: vi.fn(),
      })
    );

    expect(html).not.toContain("Are you sure you want to log out of SymphoWork?");
  });
});
