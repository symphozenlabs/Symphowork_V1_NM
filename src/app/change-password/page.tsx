import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default function ChangePasswordPage() {
  return <AuthCard title="Change your password" description="Choose a new strong password before continuing to SymphoWork." footer={<>Need help? <Link href="/login" className="font-semibold text-primary">Return to sign in</Link></>}><ChangePasswordForm /></AuthCard>;
}
