import { dev } from "$app/environment";
import type { EmailMessage, EmailProvider } from "@/lib/providers";
import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type EmailDeliveryStatus = "sent" | "not_configured" | "failed";

let provider: EmailProvider | undefined;

/** Inject a real delivery provider at the application boundary. No provider is bundled by default. */
export function configureEmailProvider(nextProvider: EmailProvider | undefined) {
  provider = nextProvider;
}

// EMAIL_PROVIDER=console is a local-only mailbox for QA addresses. Reset links
// are written outside the repository instead of being printed to terminal logs.
if (dev && process.env.EMAIL_PROVIDER === "console") {
  const localMailboxPath = process.env.DEV_EMAIL_MAILBOX_PATH?.trim() || join(tmpdir(), "symphowork-qa-local-mailbox.jsonl");
  configureEmailProvider({
    async sendEmail(message) {
      if (!message.to.trim().toLowerCase().endsWith("@dev.local")) {
        throw new Error("The local QA mailbox accepts only @dev.local recipients.");
      }
      await appendFile(localMailboxPath, `${JSON.stringify({ ...message, receivedAt: new Date().toISOString() })}\n`, {
        encoding: "utf8",
        mode: 0o600,
      });
    },
  });
}

export async function sendEmailIfConfigured(message: EmailMessage): Promise<EmailDeliveryStatus> {
  if (!provider) return "not_configured";
  try {
    await provider.sendEmail(message);
    return "sent";
  } catch {
    return "failed";
  }
}

export function getInvitationBaseUrl(baseUrl = process.env.APP_URL): string {
  const configuredUrl = baseUrl?.trim();
  if (!configuredUrl) throw new Error("The public application URL is not configured.");

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error("The public application URL is not configured.");
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error("The public application URL is not configured.");
  }

  return parsed.origin;
}

export function buildInvitationUrl(token: string, baseUrl?: string): string {
  return `${new URL("/invitations/accept", getInvitationBaseUrl(baseUrl)).toString()}?token=${encodeURIComponent(token)}`;
}

export async function sendInvitationEmail(
  input: { email: string; token: string; organizationName: string },
  baseUrl?: string,
): Promise<EmailDeliveryStatus> {
  const appUrl = baseUrl?.trim() || process.env.APP_URL?.trim();
  if (!appUrl) return "not_configured";
  return sendEmailIfConfigured({
    to: input.email,
    subject: `Invitation to join ${input.organizationName} on SymphoWork`,
    html: `<p>You have been invited to join ${input.organizationName}.</p><p><a href="${buildInvitationUrl(input.token, appUrl)}">Accept invitation</a></p>`,
  });
}
