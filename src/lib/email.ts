import type { EmailMessage, EmailProvider } from "@/lib/providers";

export type EmailDeliveryStatus = "sent" | "not_configured" | "failed";

let provider: EmailProvider | undefined;

/** Inject a real delivery provider at the application boundary. No provider is bundled by default. */
export function configureEmailProvider(nextProvider: EmailProvider | undefined) {
  provider = nextProvider;
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

export function buildInvitationUrl(token: string): string {
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "");
  if (!appUrl) throw new Error("The public application URL is not configured.");
  return `${appUrl}/invitations/accept?token=${encodeURIComponent(token)}`;
}

export async function sendInvitationEmail(input: { email: string; token: string; organizationName: string }): Promise<EmailDeliveryStatus> {
  if (!process.env.APP_URL) return "not_configured";
  return sendEmailIfConfigured({
    to: input.email,
    subject: `Invitation to join ${input.organizationName} on SymphoWork`,
    html: `<p>You have been invited to join ${input.organizationName}.</p><p><a href="${buildInvitationUrl(input.token)}">Accept invitation</a></p>`,
  });
}
