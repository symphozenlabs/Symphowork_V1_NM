import { describe, expect, it, vi } from "vitest";
import React from "react";
import { PlatformShell } from "./platform-shell";

vi.mock("@/modules/identity/auth", () => ({
  getSessionUser: vi.fn().mockResolvedValue({
    id: "platform-user-1",
    fullName: "Chief Operations Officer",
    email: "coo@symphowork.internal",
    platformRole: "PLATFORM_OWNER",
  }),
}));

vi.mock("@/modules/platform/authorization", () => ({
  platformConsoleTitle: vi.fn().mockReturnValue("Platform Owner Console"),
}));

vi.mock("@/components/layout/logout-button", () => ({
  default: () => React.createElement("button", null, "Logout"),
}));

describe("PlatformShell layout and navigation structure", () => {
  it("renders desktop sidebar with fixed viewport constraint, logo, and SidebarNav groups", async () => {
    const rendered = await PlatformShell({
      children: React.createElement("div", { id: "platform-content" }, "Platform Content"),
    });

    const rootChildren = React.Children.toArray(rendered.props.children) as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>[];

    // 1. Verify aside container
    const aside = rootChildren.find((child) => child && child.type === "aside");
    expect(aside).toBeDefined();
    expect(aside!.props.className).toContain("fixed");
    expect(aside!.props.className).toContain("inset-y-0");
    expect(aside!.props.className).toContain("left-0");
    expect(aside!.props.className).toContain("w-64");
    expect(aside!.props.className).toContain("lg:flex");

    const asideChildren = React.Children.toArray(aside!.props.children) as React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }>[];
    expect(asideChildren).toHaveLength(2);

    // 2. Header area contains SymphoWork brand logo
    const headerContainer = asideChildren[0];
    expect(headerContainer.props.className).toContain("shrink-0");
    const headerInner = React.Children.toArray(headerContainer.props.children)[0] as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    const headerInnerChildren = React.Children.toArray(headerInner.props.children) as React.ReactElement<{
      href?: string;
      children?: React.ReactNode;
    }>[];
    const brandLink = headerInnerChildren[0];
    expect(brandLink.props.href).toBe("/platform");

    const linkChildren = React.Children.toArray(brandLink.props.children) as React.ReactElement<{
      src?: string;
      alt?: string;
    }>[];
    expect(linkChildren[0].props.src).toBe("/symphowork-logo.png");
    expect(linkChildren[0].props.alt).toBe("SymphoWork");

    // 3. Scroll container contains SidebarNav with 3 platform navigation groups
    const scrollContainer = asideChildren[1];
    expect(scrollContainer.props.className).toContain("overflow-y-auto");
    const scrollChildren = React.Children.toArray(scrollContainer.props.children) as React.ReactElement<{
      groups?: { title?: string; items: { label: string; href: string }[] }[];
    }>[];
    const sidebarNav = scrollChildren[0];
    expect(sidebarNav.props.groups).toBeDefined();
    const groups = sidebarNav.props.groups!;
    expect(groups).toHaveLength(3);
    expect(groups[0].items[0].href).toBe("/platform");
    expect(groups[1].title).toBe("Tenants & Plans");
    expect(groups[1].items).toHaveLength(5);
    expect(groups[2].title).toBe("Operations & Governance");
    expect(groups[2].items).toHaveLength(7);

    // 4. Main wrapper has lg:pl-64 offset and contains Breadcrumb
    const mainWrapper = rootChildren.find(
      (child) => child && child.props && child.props.className && child.props.className.includes("lg:pl-64")
    );
    expect(mainWrapper).toBeDefined();
  });
});
