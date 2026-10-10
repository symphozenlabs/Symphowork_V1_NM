import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard
      title="Reset password"
      description="Choose a new strong password. For your security, reset links expire after one hour."
      footer={
        <>
          Return to{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            sign in
          </Link>
        </>
      }
    >
      <ResetPasswordForm token={token ?? ""} />
    </AuthCard>
  );
}
