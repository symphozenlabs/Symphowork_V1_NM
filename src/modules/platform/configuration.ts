import { z } from "zod";
import { db } from "@/db/client";
import { systemConfig } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { authorizePlatform, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";

const definitions = { "platform.display_name": z.string().trim().min(1).max(120), "platform.default_timezone": z.string().trim().min(1).max(80), "platform.default_currency": z.string().trim().length(3).toUpperCase(), "platform.support_contact": z.string().trim().email() } as const;
export type PlatformConfigurationKey = keyof typeof definitions;
export async function getPlatformConfiguration() { await authorizePlatform(PLATFORM_PERMISSIONS.configurationView); const rows = await db.select().from(systemConfig); return Object.keys(definitions).map((key) => ({ key, value: rows.find((row) => row.key === key)?.value ?? null })); }
export async function setPlatformConfiguration(input: unknown, actorUserId: string) { await authorizePlatform(PLATFORM_PERMISSIONS.configurationManage); const schema = z.object({ key: z.enum(Object.keys(definitions) as [PlatformConfigurationKey, ...PlatformConfigurationKey[]]), value: z.string() }); const data = schema.parse(input); definitions[data.key].parse(data.value); const [row] = await db.insert(systemConfig).values({ key: data.key, value: data.value }).onConflictDoUpdate({ target: systemConfig.key, set: { value: data.value, updatedAt: new Date() } }).returning(); await recordAudit({ actorUserId, action: "platform_configuration_changed", resource: "system_config", resourceId: data.key, metadata: { key: data.key } }); return row; }
