import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
export default function LoginPage() { return <AuthCard title="Welcome back" description="Sign in to your SymphoWork workspace." footer={<>New to SymphoWork? <Link className="font-semibold text-primary" href="/register">Create an account</Link></>}><LoginForm /></AuthCard>; }
