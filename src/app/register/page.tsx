import { AuthFlipView } from "@/components/auth/auth-flip-view";

export const metadata = {
  title: "Create Account | SymphoWork",
  description: "Register your operator identity on SymphoWork.",
};

export default function RegisterPage() {
  return <AuthFlipView initialMode="register" />;
}
