import { count, desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { withPlatformTransaction } from "@/db/client";
import { organizations, platformSupportNotes } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { authorizePlatform, authorizePlatformTargetOrganization, PLATFORM_PERMISSIONS } from "@/modules/platform/authorization";
import { getPlatformOrganization } from "@/modules/platform/operations";

export const supportNoteSchema = z.object({ organizationId: z.string().uuid(), note: z.string().trim().min(1).max(2000) });

export interface SupportOrganizationsQueryInput {
  query?: string;
  page?: number;
  pageSize?: number;
}

export interface SupportOrganizationsResult {
  rows: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export async function searchSupportOrganizations(
  input?: string | SupportOrganizationsQueryInput
): Promise<SupportOrganizationsResult> {
  await authorizePlatform(PLATFORM_PERMISSIONS.supportView);
  const options = typeof input === "string" ? { query: input } : (input ?? {});
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 10));
  const query = options.query?.trim();

  const whereClause = query
    ? or(ilike(organizations.name, `%${query}%`), ilike(organizations.slug, `%${query}%`))
    : undefined;

  return withPlatformTransaction(async (tx) => {
    const rows = await tx
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        status: organizations.status,
        createdAt: organizations.createdAt,
      })
      .from(organizations)
      .where(whereClause)
      .orderBy(desc(organizations.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const [{ total }] = await tx
      .select({ total: count() })
      .from(organizations)
      .where(whereClause);

    return {
      rows,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  });
}
export async function getSupportSummary(organizationId: string) { await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.supportView, action: "support_organization_view" }); return getPlatformOrganization(organizationId); }
export async function listSupportNotes(organizationId: string) { await authorizePlatformTargetOrganization({ organizationId, permission: PLATFORM_PERMISSIONS.supportView, action: "support_notes_view" }); return withPlatformTransaction((tx) => tx.select().from(platformSupportNotes).where(eq(platformSupportNotes.organizationId, organizationId)).orderBy(desc(platformSupportNotes.createdAt)).limit(50)); }
export async function createSupportNote(input: unknown, actorUserId: string) { const data = supportNoteSchema.parse(input); await authorizePlatformTargetOrganization({ organizationId: data.organizationId, permission: PLATFORM_PERMISSIONS.supportManage, action: "support_note_create" }); const note = await withPlatformTransaction(async (tx) => { const [created] = await tx.insert(platformSupportNotes).values({ ...data, createdByUserId: actorUserId }).returning(); return created; }); await recordAudit({ actorUserId, organizationId: data.organizationId, action: "platform_support_note_created", resource: "platform_support_note", resourceId: note.id, platform: true }); return note; }
