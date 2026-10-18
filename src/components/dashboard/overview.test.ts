import { describe, expect, it } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { Overview } from "./overview";

describe("Dashboard Overview Component — Phase 2 Server Preloading", () => {
  it("renders immediately with preloaded server metrics without loading spinners", () => {
    const html = renderToStaticMarkup(
      React.createElement(Overview, {
        fullName: "Alex Mercer",
        canReadEmployees: true,
        canViewApprovals: true,
        canViewAts: false,
        initialMetrics: {
          workforceCount: 42,
          pendingApprovalsCount: 5,
          unreadNotificationsCount: 3,
        },
      })
    );

    expect(html).toContain("Workforce Directory");
    expect(html).toContain("42");
    expect(html).toContain("Active team members");

    expect(html).toContain("Pending Approvals");
    expect(html).toContain("5");
    expect(html).toContain("Action required");

    expect(html).toContain("Unread Notifications");
    expect(html).toContain("3");
    expect(html).toContain("Requires review");

    // Must not show loading state
    expect(html).not.toContain("Loading metrics...");
  });

  it("suppresses workforce metric when canReadEmployees is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(Overview, {
        fullName: "Team Member",
        canReadEmployees: false,
        canViewApprovals: true,
        initialMetrics: {
          workforceCount: 42,
          pendingApprovalsCount: 0,
          unreadNotificationsCount: 0,
        },
      })
    );

    expect(html).not.toContain("Workforce Directory");
    expect(html).toContain("Pending Approvals");
    expect(html).toContain("All caught up");
    expect(html).toContain("Unread Notifications");
    expect(html).toContain("No unread alerts");
  });

  it("suppresses pending approvals metric when canViewApprovals is false", () => {
    const html = renderToStaticMarkup(
      React.createElement(Overview, {
        fullName: "Regular Employee",
        canReadEmployees: true,
        canViewApprovals: false,
        initialMetrics: {
          workforceCount: 15,
          pendingApprovalsCount: 10,
          unreadNotificationsCount: 1,
        },
      })
    );

    expect(html).toContain("Workforce Directory");
    expect(html).toContain("15");
    expect(html).not.toContain("Pending Approvals");
    expect(html).toContain("Unread Notifications");
    expect(html).toContain("1");
  });
});
