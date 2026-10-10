import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeatureFlagToggle } from "@/components/platform/feature-flag-toggle";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { listFeatureFlags } from "@/modules/platform/features";
import { Sliders, ToggleLeft, ToggleRight, Clock, Key } from "lucide-react";

export default async function FeaturesPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.featureView);
  } catch {
    redirect("/platform/login");
  }

  const features = await listFeatureFlags();
  const enabledCount = features.filter((f) => f.enabled).length;
  const disabledCount = features.length - enabledCount;

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Platform Controls
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {features.length} {features.length === 1 ? "flag" : "flags"} configured
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Feature Management
          </h1>
          <p className="mt-1 text-sm text-muted">
            Global operational switches governing platform functionality. Flags are evaluated across cluster runtimes independently of tenant commercial entitlements.
          </p>
        </div>
      </div>

      {/* Overview Metric Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Total Flags</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{features.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sliders className="h-4.5 w-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active / Enabled</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">{enabledCount}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ToggleRight className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-surface shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Disabled</p>
              <p className="mt-1 text-2xl font-bold text-slate-500">{disabledCount}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <ToggleLeft className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Flags List */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-foreground">
              Configured Feature Flags
            </CardTitle>
            <p className="text-xs text-muted">
              Toggle platform features on or off in real time with immediate cluster propagation
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {features.length ? (
            <div className="space-y-3">
              {features.map((flag) => (
                <div
                  key={flag.id}
                  className="flex flex-col gap-4 rounded-xl border border-border/70 bg-slate-50/40 p-4 transition-colors hover:border-border hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {flag.name}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-600">
                        <Key className="h-3 w-3 text-slate-400" />
                        {flag.key}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          flag.enabled
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            flag.enabled ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {flag.description && (
                      <p className="text-xs text-muted leading-relaxed">
                        {flag.description}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-muted pt-1">
                      <Clock className="h-3 w-3" />
                      <span>Updated {new Date(flag.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <FeatureFlagToggle flag={flag} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
              <Sliders className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No platform feature flags configured</p>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                No active feature toggles are registered. Add flags through migration scripts or platform bootstrap routines.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
