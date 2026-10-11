"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, RotateCcw, UserPlus } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { ForgotPasswordForm } from "./forgot-password-form";
import { AuthCommandCanvas, type AuthMode } from "./auth-command-canvas";
import { cn } from "@/lib/utils";

interface AuthFlipViewProps {
  initialMode?: AuthMode;
}

export function AuthFlipView({ initialMode = "login" }: AuthFlipViewProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [frontHeight, setFrontHeight] = useState<number | undefined>(
    initialMode === "login" ? 530 : undefined
  );
  const [registerHeight, setRegisterHeight] = useState<number | undefined>(
    initialMode === "register" ? 760 : undefined
  );
  const [forgotHeight, setForgotHeight] = useState<number | undefined>(
    initialMode === "forgot-password" ? 470 : undefined
  );

  const frontRef = useRef<HTMLDivElement>(null);
  const registerRef = useRef<HTMLDivElement>(null);
  const forgotRef = useRef<HTMLDivElement>(null);

  // Sync mode with popstate (Browser Back/Forward navigation)
  useEffect(() => {
    function onPopState() {
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.includes("register")) {
          setMode("register");
        } else if (path.includes("forgot-password")) {
          setMode("forgot-password");
        } else {
          setMode("login");
        }
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Measure content heights dynamically using scrollHeight/offsetHeight
  // so inactive constrained faces report their exact content height without clipping
  useEffect(() => {
    function measure() {
      if (frontRef.current) {
        const fh = frontRef.current.scrollHeight || frontRef.current.offsetHeight;
        if (fh > 0) setFrontHeight(fh);
      }
      if (registerRef.current) {
        const rh = registerRef.current.scrollHeight || registerRef.current.offsetHeight;
        if (rh > 0) setRegisterHeight(rh);
      }
      if (forgotRef.current) {
        const fgh = forgotRef.current.scrollHeight || forgotRef.current.offsetHeight;
        if (fgh > 0) setForgotHeight(fgh);
      }
    }
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      if (frontRef.current) ro.observe(frontRef.current);
      if (registerRef.current) ro.observe(registerRef.current);
      if (forgotRef.current) ro.observe(forgotRef.current);
    }

    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);

  function handleFlip(targetMode: AuthMode) {
    if (targetMode === mode) return;
    setMode(targetMode);
    if (typeof window !== "undefined") {
      const targetPath =
        targetMode === "login"
          ? "/login"
          : targetMode === "register"
          ? "/register"
          : "/forgot-password";
      window.history.pushState(null, "", targetPath);
      document.title =
        targetMode === "login"
          ? "Sign In | SymphoWork"
          : targetMode === "register"
          ? "Create Account | SymphoWork"
          : "Account Recovery | SymphoWork";

      // If returning to a shorter form, smoothly scroll to top
      if (targetMode === "login" || targetMode === "forgot-password") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }

  const activeHeight =
    mode === "login"
      ? frontHeight
      : mode === "register"
      ? registerHeight
      : forgotHeight;

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-12">
      {/* Left Column: SymphoWork Command Canvas with Animated Workforce HUD */}
      <AuthCommandCanvas mode={mode} />

      {/* Right Column: Focused Authentication Form with Interactive 3D Flip */}
      <div className="flex min-h-screen flex-col justify-center items-center p-6 sm:p-8 lg:col-span-7 lg:p-10 xl:p-12 bg-gradient-to-b from-[#F7F8FB] to-[#F1F5F0]">
        {/* Mobile / Tablet Header with prominent logo & dynamic state indicator */}
        <div className="w-full max-w-[500px] xl:max-w-[520px] lg:hidden flex flex-col items-center gap-2 pb-6">
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
                : mode === "register"
                ? "Operator Registration"
                : "Account Recovery Enclave"}
            </span>
          </div>
        </div>

        {/* Focused Authentication Card Composition */}
        <div className="w-full max-w-[500px] xl:max-w-[520px] my-auto py-2 sm:py-4 flex flex-col items-center">
          {/* Centered Flip Container with Dynamic Measured Height */}
          <div className="auth-flip-perspective w-full">
            <div
              className={cn(
                "auth-flip-card",
                mode === "login" && "state-login",
                mode === "register" && "state-register is-flipped",
                mode === "forgot-password" && "state-forgot"
              )}
              style={activeHeight ? { height: `${activeHeight}px` } : undefined}
            >
              {/* FACE 1 (FRONT): Login Form Card */}
              <div
                ref={frontRef}
                className="auth-card-face auth-card-front"
                aria-hidden={mode !== "login"}
                inert={mode !== "login"}
              >
                <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header className="space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <Lock className="size-3.5 text-primary" aria-hidden="true" />
                      <span>Secure Identity Gateway</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Welcome back
                    </h1>
                    <p className="text-sm text-muted leading-relaxed">
                      Sign in to your SymphoWork organization workspace.
                    </p>
                  </header>

                  <div className="mt-7">
                    <LoginForm
                      onForgotPassword={() => handleFlip("forgot-password")}
                      onRegister={() => handleFlip("register")}
                    />
                  </div>

                  <footer className="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
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

              {/* FACE 2 (BACK RIGHT): Register Form Card */}
              <div
                ref={registerRef}
                className="auth-card-face auth-card-back-register"
                aria-hidden={mode !== "register"}
                inert={mode !== "register"}
              >
                <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header className="space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <UserPlus className="size-3.5 text-primary" aria-hidden="true" />
                      <span>Operator Registration</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Create your account
                    </h1>
                    <p className="text-sm text-muted leading-relaxed">
                      Register your personal operator identity. Workspace tenant access is granted upon approved invitation.
                    </p>
                  </header>

                  <div className="mt-7">
                    <RegisterForm />
                  </div>

                  <footer className="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
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

              {/* FACE 3 (BACK LEFT): Forgot Password Recovery Card */}
              <div
                ref={forgotRef}
                className="auth-card-face auth-card-back-forgot"
                aria-hidden={mode !== "forgot-password"}
                inert={mode !== "forgot-password"}
              >
                <div className="rounded-2xl border border-[#DCE6DA] bg-surface p-8 sm:p-10 lg:p-11 shadow-[0_12px_40px_rgba(13,51,36,0.06)]">
                  <header className="space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-sidebar-active px-2.5 py-1 text-xs font-semibold text-sidebar-active-text border border-primary/10">
                      <RotateCcw className="size-3.5 text-primary" aria-hidden="true" />
                      <span>Account Recovery Enclave</span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      Forgot password
                    </h1>
                    <p className="text-sm text-muted leading-relaxed">
                      Enter your registered email address to receive a secure password recovery link.
                    </p>
                  </header>

                  <div className="mt-7">
                    <ForgotPasswordForm onSignIn={() => handleFlip("login")} />
                  </div>

                  <footer className="mt-7 border-t border-border/80 pt-5 text-center text-xs sm:text-sm text-muted">
                    Remembered your credentials?{" "}
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
          <p className="mt-6 text-center text-xs text-muted leading-relaxed">
            Protected by enterprise-grade cryptographic session authorization
          </p>
        </div>
      </div>
    </div>
  );
}
