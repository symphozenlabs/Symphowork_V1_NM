import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";
export default function RegisterPage() { return <AuthCard title="Create your account" description="Start with a secure identity. Organization access is granted through an approved invitation." footer={<>Already registered? <Link className="font-semibold text-primary" href="/login">Sign in</Link></>}><RegisterForm /></AuthCard>; }
