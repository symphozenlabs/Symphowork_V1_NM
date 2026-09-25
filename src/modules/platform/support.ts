import { desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/client";
import { organizations, platformSupportNotes } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { authorizePlatform, authorizePlatformTargetOrganization, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlatformOrganization } from "@/modules/platform/operations";

export const supportNoteSchema = z.object({ organizationId: z.string().uuid(), note: z.string().trim().min(1).max(2000) });
export async function searchSupportOrganizations(query?: string) { await authorizePlatform(PLATFORM_PERMISSIONS.supportView); return db.select({ id: organizations.id, name: organizations.name, slug: organizations.slug, status: organizations.status, createdAt: organizations.createdAt }).from(organizations).where(query ? or(ilike(organizations.name, `%${query}%`), ilike(organizations.slug, `%${query}%`)) : undefined).orderBy(desc(organizations.createdAt)).limit(50); }
export async function getSupportSummary(organizationId: string) { await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.supportView, action: "support_organization_view" }); return getPlatformOrganization(organizationId); }
export async function listSupportNotes(organizationId: string) { await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.supportView, action: "support_notes_view" }); return db.select().from(platformSupportNotes).where(eq(platformSupportNotes.organizationId, organizationId)).orderBy(desc(platformSupportNotes.createdAt)).limit(50); }
export async function createSupportNote(input: unknown, actorUserId: string) { const data = supportNoteSchema.parse(input); await authorizePlatformTargetOrganization({ organizationId: data.organizationId, permission: PLATFORM_PERMISSIONS.supportManage, action: "support_note_create" }); const [note] = await db.insert(platformSupportNotes).values({ ...data, createdByUserId: actorUserId }).returning(); await recordAudit({ actorUserId, organizationId: data.organizationId, action: "platform_support_note_created", resource: "platform_support_note", resourceId: note.id }); return note; }
