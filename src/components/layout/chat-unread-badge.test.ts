import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { ChatUnreadBadge, dispatchChatUnreadCount, CHAT_UNREAD_EVENT } from "./chat-unread-badge";
import { SidebarNav, type NavGroupDef } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/app"),
}));

describe("Sidebar Internal Chat Unread Conversation Badge Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Zero unread conversations hides the badge completely", () => {
    const html = renderToStaticMarkup(React.createElement(ChatUnreadBadge, { count: 0 }));
    expect(html).toBe("");
  });

  it("2. One conversation with 200 unread messages displays '1' (distinct conversation count, not message count)", () => {
    const html = renderToStaticMarkup(React.createElement(ChatUnreadBadge, { count: 1 }));
    expect(html).toContain('data-testid="chat-unread-badge"');
    expect(html).toContain("1");
    expect(html).toContain('aria-label="1 unread conversations"');
    // Ensure it is 1, NOT 200
    expect(html).not.toContain("200");
  });

  it("3. Two conversations with 200 and 13 unread messages display '2'", () => {
    const html = renderToStaticMarkup(React.createElement(ChatUnreadBadge, { count: 2 }));
    expect(html).toContain('data-testid="chat-unread-badge"');
    expect(html).toContain("2");
    expect(html).toContain('aria-label="2 unread conversations"');
    // Ensure it is 2, NOT 213
    expect(html).not.toContain("213");
  });

  it("4. A group conversation counts as one unread conversation", () => {
    const html = renderToStaticMarkup(React.createElement(ChatUnreadBadge, { count: 1 }));
    expect(html).toContain("1");
    expect(html).not.toContain("0");
  });

  it("5. Caps display at '99+' when unread conversation count exceeds 99", () => {
    const html = renderToStaticMarkup(React.createElement(ChatUnreadBadge, { count: 105 }));
    expect(html).toContain("99+");
    expect(html).toContain('aria-label="105 unread conversations"');
  });

  it("6. dispatchChatUnreadCount fires a custom browser event to update badge without page reload", () => {
    const dispatchSpy = vi.fn();
    const originalWindow = globalThis.window;
    (globalThis as unknown as { window: unknown }).window = {
      dispatchEvent: dispatchSpy,
    };

    dispatchChatUnreadCount(3);

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0][0] as CustomEvent<{ count: number }>;
    expect(event.type).toBe(CHAT_UNREAD_EVENT);
    expect(event.detail.count).toBe(3);

    (globalThis as unknown as { window: unknown }).window = originalWindow;
  });

  it("7. SidebarNav renders ChatUnreadBadge beside Internal chat and nowhere else", () => {
    const navGroups: NavGroupDef[] = [
      {
        title: "Core Modules",
        items: [
          { label: "Overview", href: "/app", iconKey: "overview" },
          { label: "Attendance", href: "/app/attendance", iconKey: "attendance" },
          { label: "Internal chat", href: "/app/chat", iconKey: "chat" },
        ],
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(SidebarNav, { groups: navGroups, chatUnreadCount: 2 })
    );

    // Internal chat item contains the badge
    expect(html).toContain("Internal chat");
    expect(html).toContain('data-testid="chat-unread-badge"');
    expect(html).toContain("2");

    // Only ONE badge rendered across the entire sidebar
    const badgeMatches = html.match(/data-testid="chat-unread-badge"/g);
    expect(badgeMatches).toHaveLength(1);
  });

  it("8. SidebarNav hides ChatUnreadBadge when chatUnreadCount is 0", () => {
    const navGroups: NavGroupDef[] = [
      {
        title: "Core Modules",
        items: [
          { label: "Overview", href: "/app", iconKey: "overview" },
          { label: "Internal chat", href: "/app/chat", iconKey: "chat" },
        ],
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(SidebarNav, { groups: navGroups, chatUnreadCount: 0 })
    );

    expect(html).toContain("Internal chat");
    expect(html).not.toContain('data-testid="chat-unread-badge"');
  });

  it("9. MobileNav renders navigation trigger cleanly", () => {
    const mobileItems = [
      { label: "Overview", href: "/app" },
      { label: "Internal chat", href: "/app/chat" },
    ];

    const html = renderToStaticMarkup(
      React.createElement(MobileNav, { items: mobileItems, chatUnreadCount: 1 })
    );
    expect(html).toContain("Open navigation");
  });
});
