import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { PlatformLoginForm } from "@/components/platform/platform-login-form";
export default function PlatformLoginPage() { return <AuthCard title="SymphoWork Console" description="Sign in with a platform-level identity." footer={<>Organization user? <Link className="font-semibold text-primary" href="/login">Use workspace login</Link></>}><PlatformLoginForm /></AuthCard>; }
