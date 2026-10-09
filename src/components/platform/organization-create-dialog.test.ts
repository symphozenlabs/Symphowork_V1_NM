import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationCreateDialog, type OrganizationCreateDialogProps } from "./organization-create-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return (props: Record<string, unknown>) => React.createElement("div", { "data-testid": "wizard-mock", ...props });
  },
}));

describe("OrganizationCreateDialog - Lazy Loading & Plans On-Demand", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders trigger button and closed dialog without eagerly requesting plans", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const html = renderToStaticMarkup(React.createElement(OrganizationCreateDialog));
    expect(html).toContain("Create organization");

    // Verify fetch was not called during closed dialog rendering
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("accepts preloaded initialPlans if provided without triggering a fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const mockPlans = [
      {
        id: "plan-free",
        code: "FREE",
        name: "Free Plan",
        description: "Trial tier",
        monthlyPriceCents: 0,
        annualPriceCents: 0,
        currency: "INR",
        trialDays: 14,
        maxUsers: 5,
        maxStorageBytes: 1073741824,
        billingInterval: "monthly",
        active: true,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement<OrganizationCreateDialogProps>(OrganizationCreateDialog, { initialPlans: mockPlans })
    );
    expect(html).toContain("Create organization");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
