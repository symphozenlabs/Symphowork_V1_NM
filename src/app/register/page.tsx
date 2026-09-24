import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
export default function RegisterPage() { return <AuthCard title="Create your account" description="Start with a secure identity. Organization access is granted through an approved invitation." footer={<>Already registered? <Link className="font-semibold text-primary" href="/login">Sign in</Link></>}><p className="mt-7 rounded-xl bg-[#f0f7ff] p-4 text-sm leading-6 text-muted">Self-registration is limited to identity creation. A verified invitation is required before joining an organization.</p></AuthCard>; }
