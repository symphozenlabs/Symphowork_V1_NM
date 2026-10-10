import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthCard
      title="Verify your email"
      description="Use the secure token from your verification email to activate your SymphoWork identity."
      footer={
        <>
          Need an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <VerifyEmailForm token={token} />
    </AuthCard>
  );
}
