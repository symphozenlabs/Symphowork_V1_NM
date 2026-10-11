import { AuthFlipView } from "@/components/auth/auth-flip-view";

export const metadata = {
  title: "Account Recovery | SymphoWork",
  description: "Recover your SymphoWork operator account with secure password reset.",
};

export default function ForgotPasswordPage() {
  return <AuthFlipView initialMode="forgot-password" />;
}
