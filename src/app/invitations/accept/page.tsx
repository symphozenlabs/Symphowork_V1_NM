import React from "react";
import { AlertCircle } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { InvitationAcceptForm } from "@/components/auth/invitation-accept-form";

export default async function InvitationAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard
      title="Join your organization"
      description="Review the invitation and securely complete your workspace access."
      footer={<>Already have an account? Sign in, then reopen this invitation.</>}
    >
      {token ? (
        <InvitationAcceptForm token={token} />
      ) : (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-danger-border bg-danger-bg p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>This invitation link is missing its token.</span>
        </div>
      )}
    </AuthCard>
  );
}
