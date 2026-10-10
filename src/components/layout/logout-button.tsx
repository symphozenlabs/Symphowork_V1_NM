"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { LogoutConfirmDialog } from "@/components/auth/logout-confirm-dialog";

export interface LogoutButtonProps {
  redirectTo?: string;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  children?: React.ReactNode;
  showIcon?: boolean;
}

export default function LogoutButton({
  redirectTo = "/",
  className = "ml-2",
  variant = "ghost",
  size = "sm",
  children = "Logout",
  showIcon = false,
}: LogoutButtonProps = {}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
        aria-haspopup="dialog"
      >
        {showIcon && <LogOut className="size-3.5" aria-hidden="true" />}
        <span>{children}</span>
      </Button>

      <LogoutConfirmDialog
        open={open}
        onOpenChange={setOpen}
        redirectTo={redirectTo}
      />
    </>
  );
}
