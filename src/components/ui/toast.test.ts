import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { ToastProvider, useToast } from "./toast";

describe("ToastProvider and useToast", () => {
  it("renders children cleanly and provides toast container", () => {
    function TestConsumer() {
      const { showToast } = useToast();
      return React.createElement(
        "button",
        { onClick: () => showToast({ type: "success", title: "Saved" }) },
        "Click me"
      );
    }

    const html = renderToStaticMarkup(
      React.createElement(
        ToastProvider,
        null,
        React.createElement(TestConsumer, null)
      )
    );

    expect(html).toContain("Click me");
    expect(html).toContain("aria-live=\"polite\"");
  });

  it("provides safe fallback when useToast is invoked outside ToastProvider", () => {
    let capturedHook: ReturnType<typeof useToast> | null = null;
    function OrphanConsumer() {
      capturedHook = useToast();
      return React.createElement("div", null, "Orphan");
    }

    renderToStaticMarkup(React.createElement(OrphanConsumer, null));
    expect(capturedHook).not.toBeNull();
    expect(typeof capturedHook!.showToast).toBe("function");
    expect(typeof capturedHook!.dismissToast).toBe("function");
  });
});
