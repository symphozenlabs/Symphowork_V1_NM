import { AuthFlipView } from "@/components/auth/auth-flip-view";

export const metadata = {
  title: "Sign In | SymphoWork",
  description: "Sign in to your SymphoWork enterprise organization workspace.",
};

export default function LoginPage() {
  return <AuthFlipView initialMode="login" />;
}
