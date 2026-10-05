"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button"; // adjust import if you have a button component, else use a plain button

export default function LogoutButton({ redirectTo = "/login" }: { redirectTo?: string } = {}) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        // After successful logout, redirect to target login page
        router.push(redirectTo);
      } else {
        console.error("Logout failed", await res.text());
      }
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleLogout} className="ml-2">
      Logout
    </Button>
  );
}
