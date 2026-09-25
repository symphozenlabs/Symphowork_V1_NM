import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
export default function ForgotPasswordPage() { return <AuthCard title="Forgot password" description="Request a password reset link. The response is the same whether or not an account exists." footer={<>Remembered it? <Link href="/login" className="font-semibold text-primary">Sign in</Link></>}><ForgotPasswordForm /></AuthCard>; }
