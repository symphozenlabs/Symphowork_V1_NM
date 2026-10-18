import { describe, expect, it, vi } from "vitest";
import React from "react";
(globalThis as typeof globalThis & { React: typeof React }).React = React;
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@radix-ui/react-dialog", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    Portal: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

import { ConfirmDialog } from "./confirm-dialog";
import { PromptDialog } from "./prompt-dialog";
import { ShiftFormDialog } from "../settings/shift-form-dialog";
import { MasterDataEditDialog } from "../settings/master-data-edit-dialog";

describe("Customized SymphoWork Dialog System (Native Browser UI Replacement)", () => {
  describe("ConfirmDialog", () => {
    it("does not render any DOM when open is false", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConfirmDialog, {
          open: false,
          onOpenChange: vi.fn(),
          title: "Deactivate Shift",
          description: "Are you sure you want to deactivate Morning Shift?",
          onConfirm: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("renders custom dialog markup with title, description, and action buttons when open is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConfirmDialog, {
          open: true,
          onOpenChange: vi.fn(),
          title: "Deactivate Shift",
          description: "Are you sure you want to deactivate Morning Shift?",
          confirmText: "Deactivate",
          cancelText: "Keep Active",
          variant: "destructive",
          onConfirm: vi.fn(),
        })
      );

      expect(html).toContain("Deactivate Shift");
      expect(html).toContain("Are you sure you want to deactivate Morning Shift?");
      expect(html).toContain("Deactivate");
      expect(html).toContain("Keep Active");
      expect(html).toContain("bg-danger");
      expect(html).toContain("bg-rose-100");
    });

    it("renders loading state indicator when isLoading is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(ConfirmDialog, {
          open: true,
          onOpenChange: vi.fn(),
          title: "Finalizing Payroll",
          description: "Processing organization payroll run.",
          isLoading: true,
          onConfirm: vi.fn(),
        })
      );

      expect(html).toContain("disabled");
      expect(html).toContain("animate-spin");
    });
  });

  describe("PromptDialog", () => {
    it("does not render when open is false", () => {
      const html = renderToStaticMarkup(
        React.createElement(PromptDialog, {
          open: false,
          onOpenChange: vi.fn(),
          title: "Reject Request",
          label: "Reason",
          onConfirm: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("renders custom prompt with label, input, submit, and cancel actions when open is true", () => {
      const html = renderToStaticMarkup(
        React.createElement(PromptDialog, {
          open: true,
          onOpenChange: vi.fn(),
          title: "Reject Expense Claim",
          description: "Please provide a business justification for rejecting this claim.",
          label: "Rejection Reason",
          placeholder: "e.g., Missing itemized tax invoice receipt",
          confirmText: "Confirm Rejection",
          cancelText: "Go Back",
          required: true,
          onConfirm: vi.fn(),
        })
      );

      expect(html).toContain("Reject Expense Claim");
      expect(html).toContain("Please provide a business justification for rejecting this claim.");
      expect(html).toContain("Rejection Reason");
      expect(html).toContain("Missing itemized tax invoice receipt");
      expect(html).toContain("Confirm Rejection");
      expect(html).toContain("Go Back");
    });
  });

  describe("ShiftFormDialog", () => {
    it("does not render when open is false", () => {
      const html = renderToStaticMarkup(
        React.createElement(ShiftFormDialog, {
          open: false,
          onOpenChange: vi.fn(),
          onSuccess: vi.fn(),
        })
      );
      expect(html).toBe("");
    });

    it("renders create shift form with all schedule timing fields when shift is null", () => {
      const html = renderToStaticMarkup(
        React.createElement(ShiftFormDialog, {
          open: true,
          onOpenChange: vi.fn(),
          shift: null,
          onSuccess: vi.fn(),
        })
      );

      expect(html).toContain("Create Work Shift");
      expect(html).toContain("Configure shift schedule timings, break allotments, and overnight rules.");
      expect(html).toContain("Shift Name");
      expect(html).toContain("Shift Code");
      expect(html).toContain("Start Time");
      expect(html).toContain("End Time");
      expect(html).toContain("Break Duration (Minutes)");
      expect(html).toContain("Grace Period (Minutes)");
      expect(html).toContain("Overnight Shift (Spans Past Midnight)");
      expect(html).toContain("Create Shift");
    });

    it("renders edit shift form pre-populated with existing schedule parameters", () => {
      const html = renderToStaticMarkup(
        React.createElement(ShiftFormDialog, {
          open: true,
          onOpenChange: vi.fn(),
          shift: {
            id: "shift-123",
            name: "Evening Security Shift",
            code: "SEC-EVE",
            startTime: "20:00:00",
            endTime: "04:00:00",
            breakMinutes: 45,
            graceMinutes: 10,
            overnight: true,
            status: "active",
          },
          onSuccess: vi.fn(),
        })
      );

      expect(html).toContain("Edit Work Shift");
      expect(html).toContain("Configure shift schedule timings, break allotments, and overnight rules.");
      expect(html).toContain("Evening Security Shift");
      expect(html).toContain("SEC-EVE");
      expect(html).toContain("20:00");
      expect(html).toContain("04:00");
      expect(html).toContain("Update Shift");
    });
  });

  describe("MasterDataEditDialog", () => {
    it("renders custom edit form for general master data items (Department, Designation, etc.)", () => {
      const html = renderToStaticMarkup(
        React.createElement(MasterDataEditDialog, {
          open: true,
          onOpenChange: vi.fn(),
          resource: "designations",
          label: "Designation",
          item: {
            id: "desig-1",
            name: "Principal Systems Engineer",
            code: "PSE-01",
            description: "Lead technical architect and engineer",
            status: "active",
          },
          onSuccess: vi.fn(),
        })
      );

      expect(html).toContain("Edit Designation");
      expect(html).toContain("Principal Systems Engineer");
      expect(html).toContain("PSE-01");
      expect(html).toContain("Lead technical architect and engineer");
      expect(html).toContain("Save Changes");
    });
  });
});
