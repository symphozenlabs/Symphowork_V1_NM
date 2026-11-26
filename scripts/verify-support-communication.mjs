// Run against a disposable loopback instance with pre-seeded test sessions.
// SUPPORT_TEST_SESSIONS contains { [role]: { token, id, org } } for synthetic accounts.
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const origin = "http://127.0.0.1:4199";
const sessions = JSON.parse(
  await readFile(process.env.SUPPORT_TEST_SESSIONS, "utf8"),
);
const browser = await chromium.launch({ channel: "msedge" });
const pages = {};
async function request(role, path, body, status = 200) {
  const response = await pages[role].request.fetch(origin + path, {
    method: body ? "POST" : "GET",
    data: body,
  });
  assert.equal(
    response.status(),
    status,
    role + " " + path + " " + (response.ok() ? "" : await response.text()),
  );
  return response.json();
}
const platform = "/api/platform/support";
try {
  for (const [role, { token }] of Object.entries(sessions)) {
    const context = await browser.newContext({
      extraHTTPHeaders: { Origin: origin },
    });
    await context.addCookies([
      { name: "symphowork_session", value: token, url: origin },
    ]);
    pages[role] = await context.newPage();
  }
  for (const role of [
    "PLATFORM_OWNER",
    "PRODUCT_OWNER",
    "PLATFORM_SUPPORT",
    "PLATFORM_ADMIN",
    "PLATFORM_BILLING",
  ]) {
    const allowed = !["PLATFORM_ADMIN", "PLATFORM_BILLING"].includes(role);
    const page = pages[role];
    const response = await page.goto(
      origin + "/platform/support",
    );
    assert.equal(
      response.status(),
      allowed || role === "PLATFORM_ADMIN" ? 200 : 403,
      role + " support navigation",
    );
    const legacy = await page.request.get(origin + "/platform/support/communication?q=sample", { maxRedirects: 0 });
    assert.equal(legacy.status(), allowed ? 308 : 403);
    if (allowed) assert.equal(legacy.headers().location, "/platform/support?q=sample");
    else if (role === "PLATFORM_ADMIN") assert.match(page.url(), /\/support\/troubleshooting$/);
    await request(
      role,
      platform + "/submissions",
      undefined,
      allowed ? 200 : 403,
    );
    await request(
      role,
      platform + "/announcements",
      undefined,
      allowed ? 200 : 403,
    );
    if (allowed)
      await page
        .getByRole("heading", { name: "Support Submissions", exact: true })
        .waitFor();
  }
  const staff = pages.EMPLOYEE;
  await staff.goto(origin + "/app/support");
  await staff.setViewportSize({ width: 390, height: 844 });
  await staff.getByRole("button", { name: "Open navigation" }).click();
  await staff
    .getByRole("dialog", { name: "Navigation drawer" })
    .getByRole("link", { name: "Support", exact: true })
    .click();
  await staff.keyboard.press("Escape");
  const subject = "Private query " + Date.now();
  await staff.getByRole("button", { name: "Raise a Query" }).click();
  await staff.getByLabel("Query Type").selectOption("other");
  await staff.getByLabel("Subject", { exact: true }).fill(subject);
  await staff.getByLabel("Description").fill("Synthetic private description");
  await staff.getByRole("button", { name: "Submit query" }).click();
  await staff.getByRole("link", { name: subject }).waitFor();
  const workspace = await request("EMPLOYEE", "/api/app/support");
  const submission = workspace.submissions.find((s) => s.subject === subject);
  assert.equal(submission.submitterUserId, sessions.EMPLOYEE.id);
  for (const role of ["ORGANIZATION_OWNER", "HR_ADMIN", "OTHER_ORG"]) {
    await request(
      role,
      "/api/app/support/submissions/" + submission.id,
      undefined,
      404,
    );
    assert.ok(
      !(await request(role, "/api/app/support")).submissions.some(
        (s) => s.id === submission.id,
      ),
    );
  }
  for (const [name, mimeType, buffer, status] of [
    ["oversize.pdf", "application/pdf", Buffer.alloc(2097153), 400],
    ["invalid.pdf", "application/pdf", Buffer.from("invalid signature"), 400],
    ["bad.exe", "application/octet-stream", Buffer.from("invalid"), 400],
    [
      "flagged.pdf",
      "application/pdf",
      Buffer.from("%PDF-1.7 test-infected-file"),
      422,
    ],
  ]) {
    const res = await staff.request.post(origin + "/api/app/support", {
      multipart: {
        subject: "Attachment validation",
        queryType: "other",
        description: "Test",
        file: { name, mimeType, buffer },
      },
    });
    assert.equal(res.status(), status, name + " " + (await res.text()));
  }
  const bytes = Buffer.from("%PDF-1.7 synthetic clean document");
  const upload = await staff.request.post(origin + "/api/app/support", {
    multipart: {
      subject: "Attachment",
      queryType: "other",
      description: "Test",
      file: { name: "clean.pdf", mimeType: "application/pdf", buffer: bytes },
    },
  });
  assert.equal(upload.status(), 200, await upload.text());
  const uploaded = await upload.json();
  assert.ok(!("storageKey" in uploaded.attachment));
  for (const [role, branch, status] of [
    ["EMPLOYEE", "app", 200],
    ["HR_ADMIN", "app", 404],
    ["ORGANIZATION_OWNER", "app", 404],
    ["OTHER_ORG", "app", 404],
    ["PLATFORM_OWNER", "platform", 200],
    ["PLATFORM_SUPPORT", "platform", 200],
    ["PRODUCT_OWNER", "platform", 200],
    ["PLATFORM_ADMIN", "platform", 403],
    ["PLATFORM_BILLING", "platform", 403],
  ]) {
    const res = await pages[role].request.get(
      origin +
        "/api/" +
        branch +
        "/support/attachments/" +
        uploaded.attachment.id,
    );
    assert.equal(res.status(), status, role + " download");
    if (status === 200) assert.deepEqual(await res.body(), bytes);
  }
  const spoof = await staff.request.post(origin + "/api/app/support", {
    multipart: {
      subject: "Ownership",
      description: "Synthetic",
      queryType: "other",
      organizationId: sessions.OTHER_ORG.org,
      submitterUserId: sessions.HR_ADMIN.id,
    },
  });
  assert.equal(
    (await spoof.json()).submission.submitterUserId,
    sessions.EMPLOYEE.id,
  );
  for (const role of ["PLATFORM_OWNER", "PRODUCT_OWNER", "PLATFORM_SUPPORT"]) {
    await request(role, platform + "/submissions/" + submission.id, {
      body: "Private response from " + role,
    });
  }
  for (const role of [
    "EMPLOYEE",
    "ORGANIZATION_OWNER",
    "HR_ADMIN",
    "OTHER_ORG",
  ]) {
    const notices = await request(role, "/api/app/notifications");
    assert.equal(
      notices.notifications.filter((n) => n.entityId === submission.id).length,
      role === "EMPLOYEE" ? 3 : 0,
    );
  }
  const selected = {
    type: "organization_selected_members",
    organizationId: sessions.EMPLOYEE.org,
    userIds: [sessions.EMPLOYEE.id],
  };
  for (const [audience, expected] of [
    [{ type: "all_organizations" }, 4],
    [
      {
        type: "selected_organizations",
        organizationIds: [sessions.EMPLOYEE.org, sessions.OTHER_ORG.org],
      },
      4,
    ],
    [
      {
        type: "organization_all_members",
        organizationId: sessions.EMPLOYEE.org,
      },
      3,
    ],
    [selected, 1],
  ]) {
    const preview = await request(
      "PLATFORM_SUPPORT",
      platform + "/audience",
      audience,
    );
    assert.equal(preview.count, expected);
    const { announcement, recipientCount } = await request(
      "PRODUCT_OWNER",
      platform + "/announcements",
      { title: subject, body: "Synthetic announcement", audience },
    );
    assert.equal(recipientCount, expected);
    const snapshot = await request(
      "PLATFORM_OWNER",
      platform + "/announcements/" + announcement.id + "/recipients",
    );
    assert.equal(snapshot.length, expected);
    for (const role of [
      "EMPLOYEE",
      "ORGANIZATION_OWNER",
      "HR_ADMIN",
      "OTHER_ORG",
    ]) {
      const visible = (
        await request(role, "/api/app/support")
      ).announcements.find((a) => a.id === announcement.id);
      assert.equal(
        Boolean(visible),
        snapshot.some((r) => r.userId === sessions[role].id),
      );
      if (visible) assert.ok(!("audienceMetadata" in visible));
    }
  }
  await request(
    "PLATFORM_SUPPORT",
    platform + "/audience",
    { ...selected, userIds: [sessions.OTHER_ORG.id] },
    400,
  );
  const publisher = pages.PLATFORM_SUPPORT;
  await publisher.goto(origin + "/platform/support");
  await publisher.getByRole("button", { name: "New Announcement" }).click();
  const composerDialog = publisher.getByRole("dialog", { name: "Create Announcement" });
  await composerDialog.waitFor();

  // Failed publish keeps the modal open and preserves form inputs.
  await composerDialog.getByLabel("Title", { exact: true }).fill("Preserved title");
  await composerDialog.getByLabel("Message", { exact: true }).fill("Preserved message");
  await composerDialog.getByLabel("Audience", { exact: true }).selectOption("selected_organizations");
  await composerDialog.getByRole("button", { name: "Preview recipients" }).waitFor();
  await composerDialog.getByLabel("Audience", { exact: true }).selectOption("all_organizations");
  await composerDialog.getByRole("button", { name: "Preview recipients" }).click();
  await composerDialog.getByRole("button", { name: "Publish announcement" }).waitFor();
  await publisher.route("**/api/platform/support/announcements", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: { message: "Simulated announcement failure." } }),
      });
      return;
    }
    await route.continue();
  });
  await composerDialog.getByRole("button", { name: "Publish announcement" }).click();
  await composerDialog.getByRole("alert").waitFor();
  assert.equal(await composerDialog.getByLabel("Title", { exact: true }).inputValue(), "Preserved title");
  assert.equal(await composerDialog.getByLabel("Message", { exact: true }).inputValue(), "Preserved message");
  await publisher.unroute("**/api/platform/support/announcements");

  // Successful publish closes the modal automatically, clears form, and shows success toast.
  await composerDialog.getByLabel("Title", { exact: true }).fill("UI announcement");
  await composerDialog.getByLabel("Message", { exact: true }).fill("Product team update");
  await composerDialog.getByRole("button", { name: "Preview recipients" }).click();
  await composerDialog.getByRole("button", { name: "Publish announcement" }).click();
  await publisher.getByText("Announcement published.", { exact: true }).waitFor();
  await composerDialog.waitFor({ state: "hidden" });

  await publisher.getByRole("link", { name: "Announcements", exact: true }).click();
  await publisher.getByRole("heading", { name: "UI announcement" }).waitFor();
  await publisher.getByRole("link", { name: "Communication History" }).click();
  await publisher.getByRole("link", { name: "UI announcement" }).waitFor();
  await publisher.getByRole("link", { name: "Inbox", exact: true }).click();
  await publisher.getByLabel("Organization", { exact: true }).fill("EMPLOYEE");
  await publisher.locator("select[name=status]").selectOption("replied");
  await publisher.getByRole("button", { name: "Apply filters" }).click();
  await publisher.waitForURL("**/platform/support?organization=EMPLOYEE&status=replied");

  // Platform submission details open in a modal, reply updates in modal, Escape closes modal.
  await publisher.getByRole("link", { name: subject, exact: true }).click();
  const platformModal = publisher.getByRole("dialog", { name: "Submission Details" });
  await platformModal.waitFor();
  await platformModal.getByRole("heading", { name: subject, exact: true }).waitFor();
  await platformModal.getByLabel("Reply privately").fill("Fixture browser reply");
  await platformModal.getByRole("button", { name: "Send private reply" }).click();
  await platformModal.getByText("Fixture browser reply", { exact: true }).waitFor();
  await publisher.keyboard.press("Escape");
  await platformModal.waitFor({ state: "hidden" });

  // Direct URL load & refresh on Platform submission opens modal cleanly.
  await publisher.goto(origin + "/platform/support?submission=" + submission.id);
  await platformModal.waitFor();
  await publisher.reload();
  await platformModal.waitFor();
  await platformModal.getByRole("button", { name: "Close dialog" }).click();
  await platformModal.waitFor({ state: "hidden" });

  // Notification Open for Support Reply opens Submission Details Modal (read-only for staff).
  await staff.goto(origin + "/app/notifications");
  await staff.getByRole("link", { name: /Notifications, [1-9]/ }).waitFor();
  await staff
    .getByText("Fixture browser reply", { exact: false })
    .first()
    .locator("../../..")
    .or(staff.locator("div.rounded-xl").filter({ hasText: subject }).first())
    .getByRole("link", { name: "Open", exact: true })
    .click();
  await staff.waitForURL("**/app/support?submission=*");
  const staffSubModal = staff.getByRole("dialog", { name: "Submission Details" });
  await staffSubModal.waitFor();
  await staffSubModal.getByRole("heading", { name: subject, exact: true }).waitFor();
  await staffSubModal.getByText("Fixture browser reply", { exact: true }).waitFor();
  assert.equal(await staffSubModal.getByLabel("Reply privately").count(), 0);
  await staffSubModal.getByRole("button", { name: "Close dialog" }).click();
  await staffSubModal.waitFor({ state: "hidden" });

  // Clicking submission directly on /app/support opens modal without inline expansion.
  await staff
    .locator("section")
    .filter({ hasText: "My Submissions" })
    .getByRole("link", { name: subject, exact: true })
    .click();
  await staffSubModal.waitFor();
  await staff.keyboard.press("Escape");
  await staffSubModal.waitFor({ state: "hidden" });

  // Notification Open for Support Announcement opens Announcement Details Modal.
  await staff.goto(origin + "/app/notifications");
  await staff.getByText("UI announcement", { exact: true }).locator("../../..").getByRole("link", { name: "Open", exact: true }).click();
  await staff.waitForURL("**/app/support?announcement=*");
  const staffAnnModal = staff.getByRole("dialog", { name: "Announcement Details" });
  await staffAnnModal.waitFor();
  await staffAnnModal.getByRole("heading", { name: "UI announcement", exact: true }).waitFor();
  await staffAnnModal.getByText("Product team update", { exact: true }).waitFor();
  await staff.reload();
  await staffAnnModal.waitFor();
  await staffAnnModal.getByRole("button", { name: "Close dialog" }).click();
  await staffAnnModal.waitFor({ state: "hidden" });

  const openedId = submission.id;
  const notices = await request("EMPLOYEE", "/api/app/notifications");
  const annNotice = notices.notifications.find((n) => n.entityType === "support_announcement" && n.title === "UI announcement");
  assert.ok(annNotice?.readAt);
  const replyNotice = notices.notifications.find((n) => n.entityId === openedId && n.entityType === "support_submission");
  assert.ok(replyNotice?.readAt);
  await request("HR_ADMIN", "/api/app/notifications/" + annNotice.id, {}, 404);
  console.log(
    "Verified platform roles, private threads, modal UX, all audience modes, notification badge and navigation.",
  );
} finally {
  await browser.close();
}
