import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
  }),
  usePathname: () => "/app/attendance",
  useSearchParams: () => mockSearchParams,
  redirect: vi.fn(),
}));

vi.mock("@/components/ui/toast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

import { AttendanceActions } from "./attendance-actions";

describe("AttendanceActions UI Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("renders with initialEmployeeId from searchParams and shows audit view controls for HR", () => {
    mockSearchParams = new URLSearchParams("employeeId=emp-arjun-001");

    const html = renderToStaticMarkup(
      React.createElement(AttendanceActions, {
        canViewOthers: true,
        initialEmployeeId: "emp-arjun-001",
      })
    );

    // HR audit container exists
    expect(html).toContain("HR Attendance Audit View");
    expect(html).toContain("Filter employee attendance");
    expect(html).toContain("Reset");
  });

  it("renders personal attendance view without HR selector when canViewOthers is false", () => {
    mockSearchParams = new URLSearchParams();

    const html = renderToStaticMarkup(
      React.createElement(AttendanceActions, {
        canViewOthers: false,
      })
    );

    expect(html).not.toContain("HR Attendance Audit View");
    expect(html).not.toContain("Filter employee attendance");
    expect(html).toContain("Current Attendance Status");
  });

  it("renders Clock in as enabled and Clock out/Break buttons as disabled when not clocked in", () => {
    const html = renderToStaticMarkup(
      React.createElement(AttendanceActions, {
        canViewOthers: false,
      })
    );

    // Clock in should not be disabled
    expect(html).toMatch(/<button[^>]*>Clock in<\/button>/);
    // Clock out, Start break, End break should be disabled
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Clock out<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Start break<\/button>/);
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>End break<\/button>/);
  });
});
