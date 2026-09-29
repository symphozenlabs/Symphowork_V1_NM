import { afterEach, describe, expect, it } from "vitest";
import { buildInvitationUrl } from "@/lib/email";

const originalAppUrl = process.env.APP_URL;

afterEach(() => {
  if (originalAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalAppUrl;
});

describe("buildInvitationUrl", () => {
  it("uses the configured public URL and encodes the opaque token", () => {
    process.env.APP_URL = "https://symphowork.example/";
    expect(buildInvitationUrl("opaque token?/value")).toBe("https://symphowork.example/invitations/accept?token=opaque%20token%3F%2Fvalue");
  });

  it("rejects missing public URL configuration", () => {
    delete process.env.APP_URL;
    expect(() => buildInvitationUrl("opaque-token")).toThrow("public application URL");
  });
});
