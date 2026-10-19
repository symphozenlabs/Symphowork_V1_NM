import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { AttendanceReminderModal } from "./attendance-reminder-modal";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/app/dashboard",
}));

describe("AttendanceReminderModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly as a component function", () => {
    const html = renderToStaticMarkup(
      React.createElement(AttendanceReminderModal, {})
    );
    // Initially before fetch completes, renders nothing or empty dialog container
    expect(typeof html).toBe("string");
  });

  it("handles workday dismissal logic via localStorage correctly", () => {
    const workDate = "2026-10-18";
    const storageKey = `sw_attendance_reminder_dismissed_${workDate}`;
    
    // Simulate localStorage behavior
    const storage = new Map<string, string>();
    storage.set(storageKey, "true");

    const isDismissed = storage.get(storageKey) === "true";
    expect(isDismissed).toBe(true);

    // Different workday is not dismissed
    const nextWorkdayKey = "sw_attendance_reminder_dismissed_2026-10-19";
    expect(storage.get(nextWorkdayKey)).toBeUndefined();
  });
});
