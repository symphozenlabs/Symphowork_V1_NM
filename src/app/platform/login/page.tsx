import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { PlatformLoginForm } from "@/components/platform/platform-login-form";

export default function PlatformLoginPage() {
  return (
    <AuthCard
      title="SymphoWork Console"
      description="Sign in with a platform-level administrator identity."
      isPlatform={true}
      footer={
        <>
          Organization employee or manager?{" "}
          <Link className="font-semibold text-primary hover:underline" href="/login">
            Use workspace login
          </Link>
        </>
      }
    >
      <PlatformLoginForm />
    </AuthCard>
  );
}
