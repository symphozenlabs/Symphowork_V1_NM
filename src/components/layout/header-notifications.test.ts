import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { HeaderNotifications } from "./header-notifications";

describe("HeaderNotifications Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notification link with bell icon", () => {
    const html = renderToStaticMarkup(React.createElement(HeaderNotifications, {}));
    expect(html).toContain('href="/app/notifications"');
    expect(html).toContain("Notifications");
  });
});
