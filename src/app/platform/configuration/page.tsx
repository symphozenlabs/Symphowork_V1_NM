import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfigurationEditor } from "@/components/platform/configuration-editor";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlatformConfiguration } from "@/modules/platform/configuration";
import {
  Settings,
  Clock,
  DollarSign,
  Mail,
  SlidersHorizontal,
  Lock,
} from "lucide-react";

export default async function ConfigurationPage() {
  try {
    await authorizePlatform(PLATFORM_PERMISSIONS.configurationView);
  } catch {
    redirect("/platform/login");
  }

  const configuration = await getPlatformConfiguration();

  const settingMetadata: Record<
    string,
    { title: string; description: string; icon: typeof Settings; example: string }
  > = {
    "platform.display_name": {
      title: "Platform Display Name",
      description: "Default brand designation displayed across global notifications and workspace emails.",
      icon: Settings,
      example: "e.g., SymphoWork Enterprise",
    },
    "platform.default_timezone": {
      title: "Default Platform Timezone",
      description: "Standard operational timezone used for audit log timestamps and scheduled job execution.",
      icon: Clock,
      example: "e.g., America/New_York or UTC",
    },
    "platform.default_currency": {
      title: "Commercial Currency Code",
      description: "Standard three-letter ISO currency code applied across plan billing schedules.",
      icon: DollarSign,
      example: "e.g., USD, EUR, or GBP",
    },
    "platform.support_contact": {
      title: "Platform Support Email",
      description: "Official escalation contact address displayed on tenant invitation and error screens.",
      icon: Mail,
      example: "e.g., support@symphowork.internal",
    },
  };

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Operational Defaults
            </span>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 font-medium">
              {configuration.length} typed settings
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Platform Configuration
          </h1>
          <p className="mt-1 text-sm text-muted">
            Safe operational defaults and system settings. Infrastructure secrets and credentials remain strictly isolated outside the application.
          </p>
        </div>
      </div>

      {/* Main Settings Card */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Runtime System Properties
              </CardTitle>
              <p className="text-xs text-muted">
                Allowlisted system settings validated strictly against runtime Zod schemas
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border/60 p-6">
          {configuration.map((setting) => {
            const meta = settingMetadata[setting.key] ?? {
              title: setting.key,
              description: "Allowlisted platform configuration property.",
              icon: Settings,
              example: "",
            };
            const Icon = meta.icon;

            return (
              <div
                key={setting.key}
                className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-12 lg:items-center"
              >
                <div className="space-y-1 lg:col-span-5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="font-semibold text-sm text-foreground">{meta.title}</p>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{meta.description}</p>
                  <p className="font-mono text-[11px] text-slate-400">
                    Key: {setting.key} {meta.example ? `· ${meta.example}` : ""}
                  </p>
                </div>

                <div className="lg:col-span-7">
                  <ConfigurationEditor setting={setting} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Security Architecture Notice */}
      <Card className="border-border/80 bg-surface shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted leading-relaxed">
              <strong className="text-foreground">Secret Isolation:</strong> Database credentials, cryptographic signing keys, object storage tokens, and third-party API secrets are never stored in the database or exposed via this interface. They are managed strictly via environment configuration.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
