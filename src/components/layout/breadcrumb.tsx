"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbProps {
  type?: "workspace" | "platform";
  className?: string;
}

const WORKSPACE_SEGMENT_LABELS: Record<string, string> = {
  app: "Overview",
  employees: "People",
  attendance: "Attendance",
  leave: "Leave",
  approvals: "Approvals",
  expenses: "Expenses",
  payroll: "Payroll",
  payslips: "Payslips",
  recruitment: "Recruitment",
  work: "Projects & tasks",
  chat: "Internal chat",
  reports: "Reports",
  settings: "Organization settings",
  billing: "Billing & usage",
  workflows: "Workflow settings",
  profile: "Profile",
  notifications: "Notifications",
};

const PLATFORM_SEGMENT_LABELS: Record<string, string> = {
  platform: "Overview",
  organizations: "Organizations",
  provisioning: "Provisioning",
  plans: "Plans",
  subscriptions: "Subscriptions",
  usage: "Usage",
  analytics: "Analytics",
  features: "Features",
  support: "Support",
  health: "Health",
  configuration: "Configuration",
  users: "Platform users",
  audit: "Audit",
};

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function Breadcrumb({ type = "workspace", className }: BreadcrumbProps) {
  const pathname = usePathname();

  const rootTitle = type === "platform" ? "Console" : "Workspace";
  const labelMap = type === "platform" ? PLATFORM_SEGMENT_LABELS : WORKSPACE_SEGMENT_LABELS;

  const segments: string[] = [rootTitle];

  if (pathname) {
    const rawParts = pathname.split("/").filter(Boolean);
    // Remove the leading 'app' or 'platform' prefix if there are deeper parts
    if (type === "workspace" && rawParts[0] === "app") {
      if (rawParts.length === 1) {
        segments.push("Overview");
      } else {
        const subParts = rawParts.slice(1);
        for (const part of subParts) {
          segments.push(labelMap[part] || formatSegment(part));
        }
      }
    } else if (type === "platform" && rawParts[0] === "platform") {
      if (rawParts.length === 1) {
        segments.push("Overview");
      } else {
        const subParts = rawParts.slice(1);
        for (const part of subParts) {
          segments.push(labelMap[part] || formatSegment(part));
        }
      }
    } else {
      segments.push("Overview");
    }
  } else {
    segments.push("Overview");
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("hidden items-center gap-2 text-sm md:flex", className)}>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={`${segment}-${index}`}>
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
            )}
            <span
              className={cn(
                "truncate",
                isLast ? "font-semibold text-foreground" : "font-normal text-muted"
              )}
              aria-current={isLast ? "page" : undefined}
            >
              {segment}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
