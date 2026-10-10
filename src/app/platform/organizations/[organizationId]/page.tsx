import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformOrganization } from "@/modules/platform/operations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganizationStatusActions } from "@/components/platform/organization-status-actions";
import { OrganizationInvitationActions } from "@/components/platform/organization-invitation-actions";
import { OrganizationSupportNotes } from "@/components/platform/organization-support-notes";
import {
  ArrowLeft,
  Users,
  CreditCard,
  Mail,
  ShieldCheck,
  Layers,
  KeyRound,
  History,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

export default async function OrganizationDetailsPage({
  params,
}: {
  params: Promise<{ organizationId: string }>;
}) {
  const { organizationId } = await params;
  let data;
  try {
    data = await getPlatformOrganization(organizationId);
  } catch {
    redirect("/platform/login");
  }

  const {
    organization,
    job,
    invitation,
    subscription,
    employeeCount,
    activeEmployeeCount,
    activity,
  } = data;

  if (!organization) notFound();

  const statusColorMap: Record<string, { bg: string; text: string; dot: string; border: string }> = {
    active: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-200" },
    pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-200" },
    suspended: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
    rejected: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", border: "border-slate-200" },
  };

  const currentTheme = statusColorMap[organization.status] || statusColorMap.active;

  return (
    <div className="space-y-6">
      {/* Top Navigation & Back Link */}
      <div>
        <Link
          href="/platform/organizations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Organizations</span>
        </Link>
      </div>

      {/* Executive Header Banner */}
      <div className="rounded-2xl border border-border/80 bg-surface p-6 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-md font-bold text-xl">
              {organization.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {organization.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${currentTheme.dot}`} />
                  {organization.status.toUpperCase()}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                  {organization.slug}
                </span>
              </div>
              <p className="text-sm text-muted">
                {organization.legalName} · Registered tenant in Platform Multi-Tenant Cluster
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <OrganizationStatusActions
              organizationId={organization.id}
              status={organization.status}
            />
          </div>
        </div>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Workforce */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Workforce Scale
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-foreground">{employeeCount}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                <span>{activeEmployeeCount} active employees</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provisioning Engine */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Provisioning Status
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center gap-2 text-base font-bold capitalize text-foreground">
                {job?.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                {job?.status === "running" && <Clock className="h-4 w-4 text-amber-600" />}
                {job?.status === "failed" && <AlertTriangle className="h-4 w-4 text-rose-600" />}
                <span>{job?.status ?? "Not created"}</span>
              </div>
              <div className="mt-1 text-xs text-muted font-mono truncate">
                Step: {job?.currentStep ?? "System idle"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Tier */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Commercial Contract
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-bold capitalize text-foreground">
                {subscription?.status ?? "Not provisioned"}
              </div>
              <div className="mt-1 text-xs text-muted">
                Platform Enterprise Agreement
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Contact */}
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Primary Contact
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="truncate text-sm font-semibold text-foreground" title={organization.contactEmail ?? "Not provided"}>
                {organization.contactEmail ?? "Not provided"}
              </div>
              <div className="mt-1 text-xs text-muted">
                {organization.contactPhone ?? "No phone on record"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dossier Content */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Management & Notes (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Owner Invitation Dossier */}
          <Card className="border-border/80 bg-surface shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Tenant Owner Invitation & Onboarding Access
                  </CardTitle>
                  <p className="text-xs text-muted">
                    Secure credentials delegation for initial administrative setup
                  </p>
                </div>
              </div>
              {invitation && (
                <Badge variant={invitation.status === "accepted" ? "success" : "neutral"}>
                  {invitation.status}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pt-5">
              <OrganizationInvitationActions
                organizationId={organization.id}
                invitation={
                  invitation
                    ? {
                        id: invitation.id,
                        status: invitation.status,
                        expiresAt: invitation.expiresAt.toISOString(),
                      }
                    : null
                }
              />
            </CardContent>
          </Card>

          {/* Operational Support Notes */}
          <OrganizationSupportNotes organizationId={organization.id} />
        </div>

        {/* Right Column: Metadata & Activity (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Organization Technical Metadata */}
          <Card className="border-border/80 bg-surface shadow-xs">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Tenant Identity & Boundary
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-muted">Organization ID</span>
                <span className="font-mono text-slate-700 select-all">{organization.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-muted">Subdomain Slug</span>
                <span className="font-mono font-medium text-primary">{organization.slug}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-muted">Legal Entity Name</span>
                <span className="font-medium text-slate-800">{organization.legalName}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-muted">Tenant Isolation</span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                  Postgres RLS Enforced
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-muted">Created Date</span>
                <span className="text-slate-700">
                  {new Date(organization.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Audit & Operational Activity */}
          <Card className="border-border/80 bg-surface shadow-xs">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Tenant Audit Activity
                  </CardTitle>
                </div>
                <span className="text-xs text-muted">{activity.length} events</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {activity.length ? (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {activity.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{event.action}</p>
                        <p className="text-[11px] text-muted font-mono truncate">
                          {event.resource ?? "system"} {event.resourceId ? `· ${event.resourceId.slice(0, 8)}` : ""}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] text-muted">
                        {new Date(event.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border/70 p-4 text-center">
                  <p className="text-xs text-muted">No operational activity recorded yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
