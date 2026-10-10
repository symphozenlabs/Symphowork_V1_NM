"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, UserPlus } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AuthCommandCanvas } from "./auth-command-canvas";
import { cn } from "@/lib/utils";

interface AuthFlipViewProps {
  initialMode?: "login" | "register";
}

export function AuthFlipView({ initialMode = "login" }: AuthFlipViewProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [frontHeight, setFrontHeight] = useState<number | undefined>(
    initialMode === "login" ? 465 : undefined
  );
  const [backHeight, setBackHeight] = useState<number | undefined>(
    initialMode === "register" ? 704 : undefined
  );
  const frontRef = React.useRef<HTMLDivElement>(null);
  const backRef = React.useRef<HTMLDivElement>(null);

  // Sync mode with popstate (Browser Back/Forward)
  useEffect(() => {
    function onPopState() {
      if (typeof window !== "undefined") {
        if (window.location.pathname.includes("register")) {
          setMode("register");
        } else {
          setMode("login");
        }
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Measure content heights dynamically using scrollHeight/offsetHeight
  // so inactive constrained faces can always report their full content height
  useEffect(() => {
    function measure() {
      if (frontRef.current) {
        const fh = frontRef.current.scrollHeight || frontRef.current.offsetHeight;
        if (fh > 0) setFrontHeight(fh);
      }
      if (backRef.current) {
        const bh = backRef.current.scrollHeight || backRef.current.offsetHeight;
        if (bh > 0) setBackHeight(bh);
      }
    }
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      if (frontRef.current) ro.observe(frontRef.current);
      if (backRef.current) ro.observe(backRef.current);
    }

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  function handleFlip(targetMode: "login" | "register") {
    if (targetMode === mode) return;
    setMode(targetMode);
    if (typeof window !== "undefined") {
      const targetPath = targetMode === "login" ? "/login" : "/register";
      window.history.pushState(null, "", targetPath);
      document.title =
        targetMode === "login"
          ? "Sign In | SymphoWork"
          : "Create Account | SymphoWork";

      // If returning to shorter login form, smoothly scroll to top to prevent empty void
      if (targetMode === "login") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  const activeHeight = mode === "login" ? frontHeight : backHeight;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-12">
      {/* Left Column: The SymphoWork Command Canvas (Redesigned Editorial Experience) */}
      <AuthCommandCanvas mode={mode} />

      {/* Right Column: Focused Authentication Form with Interactive 3D Flip */}
      <div className="flex min-h-screen flex-col justify-center items-center p-6 sm:p-8 lg:col-span-7 lg:p-10 xl:p-12 bg-gradient-to-b from-[#F7F8FB] to-[#F1F5F0]">
        {/* Mobile / Tablet Header with prominent logo & dynamic state indicator */}
        <div className="w-full max-w-[460px] lg:hidden flex flex-col items-center gap-2 pb-6">
          <Link
            href="/"
            className="inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-opacity hover:opacity-90"
            aria-label="SymphoWork Home"
          >
            <Image
              src="/symphowork-logo.png"
              alt="SymphoWork"
              width={180}
              height={56}
              priority
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </Link>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-sidebar-active px-3 py-0.5 text-[11px] font-semibold text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span>
              {mode === "login"
                ? "Enterprise Identity Gateway"
                : "Operator Registration"}
            </span>
          </div>
        </div>

        {/* Focused Authentication Card Composition */}
        <div className="w-full max-w-[460px] my-auto py-2 sm:py-4 flex flex-col items-center">
          {/* Centered Flip Container with Dynamic Measured Height */}
          <div className="auth-flip-perspective w-full">
            <div
              className={cn("auth-flip-card", mode === "register" && "is-flipped")}
              style={activeHeight ? { height: `${activeHeight}px` } : undefined}
            >
              {/* FRONT FACE: Login Form Card */}
              <div
                ref={frontRef}
                className="auth-card-face auth-card-front"
                aria-hidden={mode !== "login"}
                inert={mode !== "login"}
              >
                <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-7 sm:p-9 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <Lock className="size-3 text-primary" aria-hidden="true" />
                      <span>Secure Identity Gateway</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Welcome back
                    </h1>
                    <p className="text-xs text-muted leading-relaxed">
                      Sign in to your SymphoWork organization workspace.
                    </p>
                  </header>

                  <div className="mt-6">
                    <LoginForm />
                  </div>

                  <footer className="mt-6 border-t border-border/80 pt-4 text-center text-xs text-muted">
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleFlip("register")}
                      className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
                    >
                      Create account
                    </button>
                  </footer>
                </div>
              </div>

              {/* BACK FACE: Register Form Card */}
              <div
                ref={backRef}
                className="auth-card-face auth-card-back"
                aria-hidden={mode !== "register"}
                inert={mode !== "register"}
              >
                <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-7 sm:p-9 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <UserPlus className="size-3 text-primary" aria-hidden="true" />
                      <span>Operator Registration</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Create your account
                    </h1>
                    <p className="text-xs text-muted leading-relaxed">
                      Register your personal operator identity. Workspace tenant access is granted upon approved invitation.
                    </p>
                  </header>

                  <div className="mt-6">
                    <RegisterForm />
                  </div>

                  <footer className="mt-6 border-t border-border/80 pt-4 text-center text-xs text-muted">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => handleFlip("login")}
                      className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer"
                    >
                      Sign in
                    </button>
                  </footer>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance footer in natural flow directly below the card */}
          <p className="mt-5 text-center text-xs text-muted leading-relaxed">
            Protected by enterprise-grade cryptographic session authorization
          </p>
        </div>
      </div>
    </div>
  );
}
