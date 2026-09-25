import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <AuthCard title="Verify your email" description="Use the link from your verification email to activate your identity." footer={<>Need an account? <Link href="/register" className="font-semibold text-primary">Register</Link></>}><VerifyEmailForm token={token} /></AuthCard>; }
