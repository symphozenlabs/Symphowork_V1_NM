import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  staffIdentity: vi.fn(),
  listMySupportWorkspace: vi.fn(),
  getMySupportSubmission: vi.fn(),
  getMySupportAnnouncement: vi.fn(),
}));

vi.mock("$lib/server/support-http", () => ({
  staffIdentity: mocks.staffIdentity,
}));

vi.mock("@/modules/platform/support-communication", () => ({
  listMySupportWorkspace: mocks.listMySupportWorkspace,
  getMySupportSubmission: mocks.getMySupportSubmission,
  getMySupportAnnouncement: mocks.getMySupportAnnouncement,
}));

import { load } from "./+page.server";

describe("Organization Support (/app/support) server loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.staffIdentity.mockResolvedValue({
      userId: "user-1",
      submitterUserId: "user-1",
      submitterName: "Employee One",
      submitterEmail: "emp@example.test",
      organizationId: "org-1",
      organizationName: "Acme Corp",
      organizationRole: "EMPLOYEE",
      userRole: "EMPLOYEE",
    });
  });

  function makeEvent(search = "") {
    return {
      url: new URL(`https://example.test/app/support${search}`),
      parent: async () => ({}),
      depends: vi.fn(),
    } as any;
  }

  it("loads full workspace plus direct-URL submission and announcement details", async () => {
    mocks.listMySupportWorkspace.mockResolvedValue({
      submissions: [{ id: "sub-1", subject: "Help" }],
      announcements: [{ id: "ann-1", title: "Release", body: "Notes", publishedAt: "2026-11-26", notificationId: "n-1", readAt: null }],
    });
    mocks.getMySupportSubmission.mockResolvedValue({
      submission: { id: "sub-1", subject: "Help" },
      replies: [],
      attachments: [],
    });

    const data = (await load(makeEvent("?submission=sub-1&announcement=ann-1"))) as any;
    expect(data.submissions).toHaveLength(1);
    expect(data.announcements).toHaveLength(1);
    expect(data.selected.submission.id).toBe("sub-1");
    expect(data.selectedAnnouncement.id).toBe("ann-1");
    expect(data.selectedError).toBe("");
    expect(data.announcementError).toBe("");
    expect(mocks.listMySupportWorkspace).toHaveBeenCalledWith({
      userId: "user-1",
      submitterUserId: "user-1",
      submitterName: "Employee One",
      submitterEmail: "emp@example.test",
      organizationId: "org-1",
      organizationName: "Acme Corp",
      organizationRole: "EMPLOYEE",
      userRole: "EMPLOYEE",
    });
    expect(mocks.getMySupportAnnouncement).not.toHaveBeenCalled();
  });

  it("handles deleted or unauthorized submission deep links gracefully without leaking data", async () => {
    mocks.listMySupportWorkspace.mockResolvedValue({
      submissions: [],
      announcements: [],
    });
    mocks.getMySupportSubmission.mockRejectedValue(
      new AppError("NOT_FOUND", "Submission was not found.", 404),
    );

    const data = (await load(makeEvent("?submission=other-user-sub"))) as any;
    expect(data.selected).toBeNull();
    expect(data.selectedError).toBe(
      "This submission could not be found or you do not have permission to view it.",
    );
  });

  it("handles unauthorized or non-recipient announcement deep links gracefully without leaking data", async () => {
    mocks.listMySupportWorkspace.mockResolvedValue({
      submissions: [],
      announcements: [],
    });
    mocks.getMySupportAnnouncement.mockRejectedValue(
      new AppError("NOT_FOUND", "Announcement was not found.", 404),
    );

    const data = (await load(makeEvent("?announcement=non-recipient-ann"))) as any;
    expect(data.selectedAnnouncement).toBeNull();
    expect(data.announcementError).toBe(
      "This announcement is unavailable or you are not an authorized recipient.",
    );
  });

  it("returns controlled HTTP 503 when support tables are missing (wrapped 42P01)", async () => {
    const pgErr = Object.assign(new Error('relation "support_submissions" does not exist'), { code: "42P01" });
    const drizzleErr = Object.assign(new Error("Failed query"), { cause: pgErr });
    mocks.listMySupportWorkspace.mockRejectedValue(drizzleErr);

    await expect(load(makeEvent())).rejects.toMatchObject({
      status: 503,
      body: { message: "Support is unavailable until its database migration is applied." },
    });
  });

  it("preserves HTTP 403 AppErrors without converting to 500 or 503", async () => {
    mocks.listMySupportWorkspace.mockRejectedValue(
      new AppError("FORBIDDEN", "Organization membership is required.", 403),
    );
    await expect(load(makeEvent())).rejects.toMatchObject({
      status: 403,
      body: { message: "Organization membership is required." },
    });
  });
});
