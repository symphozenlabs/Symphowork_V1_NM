import { resolveTenantContext } from "@/modules/tenancy/context";
import { sql, and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { z } from "zod";
import {
  withPlatformTransaction,
  withTenantTransaction,
  type DbTransaction,
} from "@/db/client";
import {
  employees,
  memberships,
  notificationDeliveries,
  notifications,
  organizations,
  supportAnnouncementRecipients,
  supportAnnouncements,
  supportAttachments,
  supportReplies,
  supportSubmissions,
  users,
} from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAuditInTransaction } from "@/lib/audit";
import { getStorageProvider } from "@/lib/storage";
import { admitAndUploadFile } from "@/modules/files/upload-admission";
import {
  authorizeSupportCommunication,
  PLATFORM_PERMISSIONS,
} from "@/modules/platform/authorization";

export const SUPPORT_QUERY_TYPES = [
  "bug_technical",
  "product_query",
  "feature_request",
  "subscription_billing",
  "terms_compliance",
  "other",
] as const;
export const supportSubmissionInputSchema = z.object({
  queryType: z.enum(SUPPORT_QUERY_TYPES),
  subject: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(12000),
});
export const supportReplyInputSchema = z.object({
  body: z.string().trim().min(1).max(12000),
});
export const supportAudienceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all_organizations") }),
  z.object({
    type: z.literal("selected_organizations"),
    organizationIds: z.array(z.string().uuid()).min(1).max(200),
  }),
  z.object({
    type: z.literal("organization_all_members"),
    organizationId: z.string().uuid(),
  }),
  z.object({
    type: z.literal("organization_selected_members"),
    organizationId: z.string().uuid(),
    userIds: z.array(z.string().uuid()).min(1).max(500),
  }),
]);
export const supportAnnouncementInputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  body: z.string().trim().min(1).max(12000),
  audience: supportAudienceSchema,
});

type Audience = z.infer<typeof supportAudienceSchema>;
type Recipient = {
  userId: string;
  organizationId: string;
  employeeId: string | null;
  fullName: string;
  email: string;
  organizationName: string;
};
const queryLabels: Record<(typeof SUPPORT_QUERY_TYPES)[number], string> = {
  bug_technical: "Bug / Technical Issue",
  product_query: "Product Query",
  feature_request: "Feature Request",
  subscription_billing: "Subscription & Billing",
  terms_compliance: "Terms & Compliance",
  other: "Other",
};

function safeFileName(fileName: string) {
  const name = fileName
    .replace(/[\\/\0-\x1f\x7f]/g, "_")
    .trim()
    .slice(0, 240);
  return name || "attachment";
}

async function resolveAnnouncementRecipients(
  tx: DbTransaction,
  audience: Audience,
): Promise<Recipient[]> {
  const conditions = [
    eq(memberships.status, "active"),
    eq(organizations.status, "active"),
    eq(users.status, "active"),
  ];
  if (audience.type === "selected_organizations") {
    const requested = [...new Set(audience.organizationIds)];
    const eligible = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.status, "active"),
          inArray(organizations.id, requested),
        ),
      );
    if (eligible.length !== requested.length)
      throw new AppError(
        "VALIDATION_ERROR",
        "One or more organizations are unavailable.",
        400,
      );
    conditions.push(inArray(memberships.organizationId, requested));
  } else if (
    audience.type === "organization_all_members" ||
    audience.type === "organization_selected_members"
  ) {
    conditions.push(eq(memberships.organizationId, audience.organizationId));
    const [organization] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.id, audience.organizationId),
          eq(organizations.status, "active"),
        ),
      )
      .limit(1);
    if (!organization)
      throw new AppError(
        "NOT_FOUND",
        "Organization was not found or is not active.",
        404,
      );
  }
  if (audience.type === "organization_selected_members") {
    const requested = [...new Set(audience.userIds)];
    const selected = await tx
      .select({
        userId: memberships.userId,
        organizationId: memberships.organizationId,
        employeeId: employees.id,
        fullName: users.fullName,
        email: users.email,
        organizationName: organizations.name,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .innerJoin(
        organizations,
        eq(organizations.id, memberships.organizationId),
      )
      .leftJoin(
        employees,
        and(
          eq(employees.userId, users.id),
          eq(employees.organizationId, organizations.id),
        ),
      )
      .where(and(...conditions, inArray(memberships.userId, requested)));
    if (selected.length !== requested.length)
      throw new AppError(
        "VALIDATION_ERROR",
        "Every selected member must be active in the selected organization.",
        400,
      );
    return selected;
  }
  return tx
    .select({
      userId: memberships.userId,
      organizationId: memberships.organizationId,
      employeeId: employees.id,
      fullName: users.fullName,
      email: users.email,
      organizationName: organizations.name,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .leftJoin(
      employees,
      and(
        eq(employees.userId, users.id),
        eq(employees.organizationId, organizations.id),
      ),
    )
    .where(and(...conditions));
}

async function requireStaff(organizationId: string, userId: string) {
  const tenant = await resolveTenantContext();
  if (
    !tenant.organization ||
    tenant.organization.id !== organizationId ||
    tenant.user.id !== userId ||
    tenant.membership.status !== "active"
  ) {
    throw new AppError(
      "FORBIDDEN",
      "Organization membership is required.",
      403,
    );
  }
  return tenant;
}

function withStaffTransaction<T>(
  organizationId: string,
  userId: string,
  operation: (tx: DbTransaction) => Promise<T>,
) {
  return withTenantTransaction(organizationId, async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_user_id', ${userId}, true)`,
    );
    return operation(tx);
  });
}

export async function createSupportSubmission(input: {
  organizationId: string;
  submitterUserId: string;
  submitterName: string;
  submitterEmail: string;
  organizationName: string;
  organizationRole: string;
  query: unknown;
  file?: { bytes: Uint8Array; fileName: string; mimeType: string };
}) {
  const tenant = await requireStaff(
    input.organizationId,
    input.submitterUserId,
  );
  const data = supportSubmissionInputSchema.parse(input.query);

  let uploaded:
    | {
        storageKey: string;
        fileName: string;
        mimeType: string;
        fileSize: number;
        contentHash: string;
        scanStatus: "clean";
      }
    | undefined;
  if (input.file) {
    if (input.file.bytes.byteLength > 2 * 1024 * 1024)
      throw new AppError(
        "VALIDATION_ERROR",
        "Attachments must be 2 MB or smaller.",
        400,
      );
    const fileName = safeFileName(input.file.fileName);
    const storageKey = `${input.organizationId}/support/${crypto.randomUUID()}`;
    const admission = await admitAndUploadFile({
      kind: "document",
      fileName,
      mimeType: input.file.mimeType,
      bytes: input.file.bytes,
      storage: getStorageProvider(),
      storageKey,
    });
    uploaded = {
      storageKey,
      fileName,
      mimeType: input.file.mimeType,
      fileSize: input.file.bytes.byteLength,
      ...admission,
    };
  }
  try {
    return await withStaffTransaction(
      input.organizationId,
      input.submitterUserId,
      async (tx) => {
        const [submission] = await tx
          .insert(supportSubmissions)
          .values({
            organizationId: input.organizationId,
            submitterUserId: input.submitterUserId,
            submitterName: tenant.user.fullName,
            submitterEmail: tenant.user.email,
            organizationName: tenant.organization!.name,
            queryType: data.queryType,
            subject: data.subject,
            description: data.description,
          })
          .returning();
        let attachment: {
          id: string;
          fileName: string;
          mimeType: string;
          fileSize: number;
          scanStatus: "clean";
        } | null = null;
        if (uploaded) {
          const [row] = await tx
            .insert(supportAttachments)
            .values({
              submissionId: submission.id,
              organizationId: input.organizationId,
              uploadedByUserId: input.submitterUserId,
              ...uploaded,
            })
            .returning();
          await recordAuditInTransaction(tx, {
            actorUserId: input.submitterUserId,
            organizationId: input.organizationId,
            action: "support_attachment_uploaded",
            resource: "support_attachment",
            resourceId: row.id,
            metadata: {
              actorRole: tenant.role!.key,
              submissionId: submission.id,
            },
          });
          attachment = {
            id: row.id,
            fileName: row.fileName,
            mimeType: row.mimeType,
            fileSize: row.fileSize,
            scanStatus: uploaded.scanStatus,
          };
        }
        await recordAuditInTransaction(tx, {
          actorUserId: input.submitterUserId,
          organizationId: input.organizationId,
          action: "support_submission_created",
          resource: "support_submission",
          resourceId: submission.id,
          metadata: {
            actorRole: tenant.role!.key,
            queryType: submission.queryType,
            hasAttachment: Boolean(attachment),
          },
        });
        return { submission, attachment };
      },
    );
  } catch (error) {
    if (uploaded)
      await getStorageProvider()
        .delete(uploaded.storageKey)
        .catch(() => undefined);
    throw error;
  }
}

export async function listMySupportWorkspace(input: {
  organizationId: string;
  userId: string;
  announcementId?: string;
}) {
  await requireStaff(input.organizationId, input.userId);
  const submissions = await withStaffTransaction(
    input.organizationId,
    input.userId,
    async (tx) => {
      const rows = await tx
        .select()
        .from(supportSubmissions)
        .where(
          and(
            eq(supportSubmissions.organizationId, input.organizationId),
            eq(supportSubmissions.submitterUserId, input.userId),
          ),
        )
        .orderBy(desc(supportSubmissions.createdAt))
        .limit(100);
      if (!rows.length) return [];
      const ids = rows.map((row) => row.id);
      const replies = await tx
        .select({
          reply: supportReplies,
          authorName: users.fullName,
          authorRole: users.platformRole,
        })
        .from(supportReplies)
        .innerJoin(users, eq(users.id, supportReplies.authorUserId))
        .where(
          and(
            eq(supportReplies.organizationId, input.organizationId),
            inArray(supportReplies.submissionId, ids),
          ),
        )
        .orderBy(supportReplies.createdAt);
      const attachments = await tx
        .select({
          id: supportAttachments.id,
          submissionId: supportAttachments.submissionId,
          fileName: supportAttachments.fileName,
          mimeType: supportAttachments.mimeType,
          fileSize: supportAttachments.fileSize,
        })
        .from(supportAttachments)
        .where(
          and(
            eq(supportAttachments.organizationId, input.organizationId),
            inArray(supportAttachments.submissionId, ids),
          ),
        );
      return rows.map((submission) => ({
        ...submission,
        replies: replies
          .filter((item) => item.reply.submissionId === submission.id)
          .map((item) => ({
            ...item.reply,
            authorName: item.authorName,
            authorRole: item.authorRole,
          })),
        attachments: attachments
          .filter((item) => item.submissionId === submission.id)
          .map(({ submissionId: _submissionId, ...attachment }) => attachment),
      }));
    },
  );
  const announcements = await withStaffTransaction(
    input.organizationId,
    input.userId,
    async (tx) =>
      tx
        .select({
          announcement: {
            id: supportAnnouncements.id,
            title: supportAnnouncements.title,
            body: supportAnnouncements.body,
            publishedAt: supportAnnouncements.publishedAt,
          },
          notificationId: notifications.id,
          readAt: notifications.readAt,
        })
        .from(supportAnnouncementRecipients)
        .innerJoin(
          supportAnnouncements,
          eq(
            supportAnnouncements.id,
            supportAnnouncementRecipients.announcementId,
          ),
        )
        .leftJoin(
          notifications,
          and(
            eq(notifications.entityType, "support_announcement"),
            eq(notifications.entityId, supportAnnouncements.id),
            eq(
              notifications.organizationId,
              supportAnnouncementRecipients.organizationId,
            ),
            eq(
              notifications.recipientUserId,
              supportAnnouncementRecipients.recipientUserId,
            ),
          ),
        )
        .where(
          and(
            eq(
              supportAnnouncementRecipients.organizationId,
              input.organizationId,
            ),
            eq(supportAnnouncementRecipients.recipientUserId, input.userId),
            input.announcementId
              ? eq(supportAnnouncements.id, input.announcementId)
              : undefined,
          ),
        )
        .orderBy(desc(supportAnnouncements.publishedAt))
        .limit(100),
  );
  if (input.announcementId && !announcements.length)
    throw new AppError("NOT_FOUND", "Announcement was not found.", 404);
  return {
    submissions,
    announcements: announcements.map(
      ({ announcement, notificationId, readAt }) => ({
        ...announcement,
        notificationId,
        readAt,
      }),
    ),
  };
}

const UUID_RE = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export async function getMySupportSubmission(input: {
  organizationId: string;
  userId: string;
  submissionId: string;
}) {
  await requireStaff(input.organizationId, input.userId);
  if (!UUID_RE.test(input.submissionId))
    throw new AppError("NOT_FOUND", "Submission was not found.", 404);
  return withStaffTransaction(
    input.organizationId,
    input.userId,
    async (tx) => {
      const [submission] = await tx
        .select()
        .from(supportSubmissions)
        .where(
          and(
            eq(supportSubmissions.id, input.submissionId),
            eq(supportSubmissions.organizationId, input.organizationId),
            eq(supportSubmissions.submitterUserId, input.userId),
          ),
        )
        .limit(1);
      if (!submission)
        throw new AppError("NOT_FOUND", "Submission was not found.", 404);
      const [replies, attachments] = await Promise.all([
        tx
          .select({ reply: supportReplies, authorName: users.fullName })
          .from(supportReplies)
          .innerJoin(users, eq(users.id, supportReplies.authorUserId))
          .where(
            and(
              eq(supportReplies.submissionId, submission.id),
              eq(supportReplies.organizationId, input.organizationId),
            ),
          )
          .orderBy(supportReplies.createdAt),
        tx
          .select({
            id: supportAttachments.id,
            fileName: supportAttachments.fileName,
            mimeType: supportAttachments.mimeType,
            fileSize: supportAttachments.fileSize,
          })
          .from(supportAttachments)
          .where(
            and(
              eq(supportAttachments.submissionId, submission.id),
              eq(supportAttachments.organizationId, input.organizationId),
            ),
          ),
      ]);
      return {
        submission,
        replies: replies.map(({ reply, authorName }) => ({
          ...reply,
          authorName,
        })),
        attachments,
      };
    },
  );
}

export async function getMySupportAnnouncement(input: {
  organizationId: string;
  userId: string;
  announcementId: string;
}) {
  await requireStaff(input.organizationId, input.userId);
  if (!UUID_RE.test(input.announcementId))
    throw new AppError("NOT_FOUND", "Announcement was not found.", 404);
  return withStaffTransaction(
    input.organizationId,
    input.userId,
    async (tx) => {
      const [row] = await tx
        .select({
          announcement: {
            id: supportAnnouncements.id,
            title: supportAnnouncements.title,
            body: supportAnnouncements.body,
            publishedAt: supportAnnouncements.publishedAt,
          },
          notificationId: notifications.id,
          readAt: notifications.readAt,
        })
        .from(supportAnnouncementRecipients)
        .innerJoin(
          supportAnnouncements,
          eq(
            supportAnnouncements.id,
            supportAnnouncementRecipients.announcementId,
          ),
        )
        .leftJoin(
          notifications,
          and(
            eq(notifications.entityType, "support_announcement"),
            eq(notifications.entityId, supportAnnouncements.id),
            eq(
              notifications.organizationId,
              supportAnnouncementRecipients.organizationId,
            ),
            eq(
              notifications.recipientUserId,
              supportAnnouncementRecipients.recipientUserId,
            ),
          ),
        )
        .where(
          and(
            eq(
              supportAnnouncementRecipients.organizationId,
              input.organizationId,
            ),
            eq(supportAnnouncementRecipients.recipientUserId, input.userId),
            eq(supportAnnouncements.id, input.announcementId),
          ),
        )
        .limit(1);
      if (!row)
        throw new AppError("NOT_FOUND", "Announcement was not found.", 404);
      return {
        ...row.announcement,
        notificationId: row.notificationId,
        readAt: row.readAt,
      };
    },
  );
}


const hasSupportReply = sql`exists (
  select 1 from ${supportReplies}
  where ${supportReplies.submissionId} = ${supportSubmissions.id}
)`;

export async function getPlatformSupportStats() {
  await authorizeSupportCommunication(PLATFORM_PERMISSIONS.supportSubmissionView);
  return withPlatformTransaction(async (tx) => {
    const [counts] = await tx.select({
      total: count(),
      replied: sql<number>`count(*) filter (where ${hasSupportReply})::int`,
    }).from(supportSubmissions);
    return { total: counts.total, replied: counts.replied, awaiting: counts.total - counts.replied };
  });
}
export async function listPlatformSupportSubmissions(input: {
  queryType?: string;
  organization?: string;
  status?: string;
  includeHistory?: boolean;
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportSubmissionView,
  );
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize ?? 20)));
  const term = input.query?.trim();
  const where = and(
    input.organization?.trim() ? ilike(supportSubmissions.organizationName, `%${input.organization.trim()}%`) : undefined,
    input.status === "replied" ? hasSupportReply : input.status === "awaiting" ? sql`not ${hasSupportReply}` : undefined,
    input.queryType
      ? eq(supportSubmissions.queryType, input.queryType)
      : undefined,
    term
      ? or(
          ilike(supportSubmissions.subject, `%${term}%`),
          ilike(supportSubmissions.queryType, `%${term}%`),
          ilike(supportSubmissions.submitterName, `%${term}%`),
          ilike(supportSubmissions.submitterEmail, `%${term}%`),
          ilike(supportSubmissions.organizationName, `%${term}%`),
        )
      : undefined,
  );
  return withPlatformTransaction(async (tx) => {
    const [rows, [{ total }]] = await Promise.all([
      tx
        .select()
        .from(supportSubmissions)
        .where(where)
        .orderBy(desc(supportSubmissions.createdAt), desc(supportSubmissions.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      tx.select({ total: count() }).from(supportSubmissions).where(where),
    ]);
    if (!rows.length)
      return {
        rows: [],
        total,
        page,
        pageSize,
        pageCount: Math.max(1, Math.ceil(total / pageSize)),
      };
    const ids = rows.map((row) => row.id);
    const [replyRows, attachmentRows] = await Promise.all([
      tx
        .select({
          submissionId: supportReplies.submissionId,
          createdAt: supportReplies.createdAt,
          authorSide: supportReplies.authorSide,
        })
        .from(supportReplies)
        .where(inArray(supportReplies.submissionId, ids))
        .orderBy(desc(supportReplies.createdAt)),
      tx
        .select({ submissionId: supportAttachments.submissionId })
        .from(supportAttachments)
        .where(inArray(supportAttachments.submissionId, ids)),
    ]);
    return {
      rows: rows.map((row) => ({
        ...row,
        queryTypeLabel:
          queryLabels[row.queryType as keyof typeof queryLabels] ??
          row.queryType,
        replyCount: replyRows.filter((reply) => reply.submissionId === row.id)
          .length,
        historyReplies: input.includeHistory ? replyRows.filter((reply) => reply.submissionId === row.id).map(({ createdAt }) => ({ createdAt })) : [],
        latestReply:
          replyRows.find((reply) => reply.submissionId === row.id) ?? null,
        hasAttachment: attachmentRows.some(
          (attachment) => attachment.submissionId === row.id,
        ),
      })),
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  });
}

export async function getPlatformSupportSubmission(submissionId: string) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportSubmissionView,
  );
  return withPlatformTransaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(supportSubmissions)
      .where(eq(supportSubmissions.id, submissionId))
      .limit(1);
    if (!submission)
      throw new AppError("NOT_FOUND", "Submission was not found.", 404);
    const [replies, attachments] = await Promise.all([
      tx
        .select({
          reply: supportReplies,
          authorName: users.fullName,
          authorEmail: users.email,
        })
        .from(supportReplies)
        .innerJoin(users, eq(users.id, supportReplies.authorUserId))
        .where(
          and(
            eq(supportReplies.submissionId, submissionId),
            eq(supportReplies.organizationId, submission.organizationId),
          ),
        )
        .orderBy(supportReplies.createdAt),
      tx
        .select({
          id: supportAttachments.id,
          fileName: supportAttachments.fileName,
          mimeType: supportAttachments.mimeType,
          fileSize: supportAttachments.fileSize,
          scanStatus: supportAttachments.scanStatus,
        })
        .from(supportAttachments)
        .where(
          and(
            eq(supportAttachments.submissionId, submissionId),
            eq(supportAttachments.organizationId, submission.organizationId),
          ),
        ),
    ]);
    return {
      submission,
      replies: replies.map(({ reply, authorName, authorEmail }) => ({
        ...reply,
        authorName,
        authorEmail,
      })),
      attachments,
    };
  });
}

export async function sendPlatformSupportReply(
  submissionId: string,
  bodyInput: unknown,
) {
  const actor = await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportReplySend,
  );
  const { body } = supportReplyInputSchema.parse(bodyInput);
  return withPlatformTransaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(supportSubmissions)
      .where(eq(supportSubmissions.id, submissionId))
      .limit(1);
    if (!submission)
      throw new AppError("NOT_FOUND", "Submission was not found.", 404);
    const [reply] = await tx
      .insert(supportReplies)
      .values({
        submissionId,
        organizationId: submission.organizationId,
        authorUserId: actor.id,
        authorSide: "platform",
        body,
      })
      .returning();
    const idempotencyKey = `support-reply:${reply.id}:${submission.submitterUserId}`;
    const [notification] = await tx
      .insert(notifications)
      .values({
        organizationId: submission.organizationId,
        recipientUserId: submission.submitterUserId,
        category: "system",
        type: "support_private_reply",
        title: "Support replied to your query",
        message: `The SymphoWork Product Team replied to “${submission.subject}”.`,
        entityType: "support_submission",
        entityId: submission.id,
        actionUrl: `/app/support?submission=${submission.id}`,
        idempotencyKey,
      })
      .onConflictDoNothing({
        target: [notifications.organizationId, notifications.idempotencyKey],
      })
      .returning();
    if (notification)
      await tx
        .insert(notificationDeliveries)
        .values({
          organizationId: submission.organizationId,
          notificationId: notification.id,
          channel: "in_app",
          status: "sent",
          sentAt: new Date(),
        });
    await recordAuditInTransaction(tx, {
      actorUserId: actor.id,
      organizationId: submission.organizationId,
      action: "support_private_reply_sent",
      resource: "support_reply",
      resourceId: reply.id,
      metadata: { actorRole: actor.platformRole, submissionId },
    });
    return reply;
  });
}

async function recipientResolver(audience: Audience) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportRecipientSelect,
  );
  return withPlatformTransaction((tx) =>
    resolveAnnouncementRecipients(tx, audience),
  );
}

export async function listSupportRecipientOrganizations(query?: string) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportRecipientSelect,
  );
  const term = query?.trim();
  return withPlatformTransaction((tx) =>
    tx
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
      })
      .from(organizations)
      .where(
        and(
          eq(organizations.status, "active"),
          term
            ? or(
                ilike(organizations.name, `%${term}%`),
                ilike(organizations.slug, `%${term}%`),
              )
            : undefined,
        ),
      )
      .orderBy(organizations.name)
      .limit(100),
  );
}

export async function listSupportOrganizationMembers(
  organizationId: string,
  query?: string,
) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportRecipientSelect,
  );
  const term = query?.trim();
  return withPlatformTransaction(async (tx) => {
    const [org] = await tx
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.id, organizationId),
          eq(organizations.status, "active"),
        ),
      )
      .limit(1);
    if (!org)
      throw new AppError(
        "NOT_FOUND",
        "Organization was not found or is not active.",
        404,
      );
    return tx
      .select({
        userId: users.id,
        employeeId: employees.id,
        fullName: users.fullName,
        email: users.email,
      })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .leftJoin(
        employees,
        and(
          eq(employees.userId, users.id),
          eq(employees.organizationId, organizationId),
        ),
      )
      .where(
        and(
          eq(memberships.organizationId, organizationId),
          eq(memberships.status, "active"),
          eq(users.status, "active"),
          term
            ? or(
                ilike(users.fullName, `%${term}%`),
                ilike(users.email, `%${term}%`),
              )
            : undefined,
        ),
      )
      .orderBy(users.fullName)
      .limit(100);
  });
}

export async function previewSupportAnnouncementRecipients(
  audienceInput: unknown,
) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportRecipientSelect,
  );
  const audience = supportAudienceSchema.parse(audienceInput);
  const recipients = await recipientResolver(audience);
  return {
    count: recipients.length,
    sample: recipients
      .slice(0, 25)
      .map(({ userId, organizationId, fullName, email, organizationName }) => ({
        userId,
        organizationId,
        fullName,
        email,
        organizationName,
      })),
  };
}

export async function publishSupportAnnouncement(input: unknown) {
  const actor = await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportAnnouncementPublish,
  );
  const data = supportAnnouncementInputSchema.parse(input);
  return withPlatformTransaction(async (tx) => {
    const recipients = await resolveAnnouncementRecipients(tx, data.audience);
    if (!recipients.length)
      throw new AppError(
        "VALIDATION_ERROR",
        "The selected audience has no active recipients.",
        400,
      );
    const [announcement] = await tx
      .insert(supportAnnouncements)
      .values({
        authorUserId: actor.id,
        authorRole: actor.platformRole,
        title: data.title,
        body: data.body,
        audienceType: data.audience.type,
        audienceMetadata: JSON.stringify(data.audience),
      })
      .returning();
    for (let offset = 0; offset < recipients.length; offset += 400) {
      const batch = recipients.slice(offset, offset + 400);
      await tx
        .insert(supportAnnouncementRecipients)
        .values(
          batch.map((recipient) => ({
            announcementId: announcement.id,
            organizationId: recipient.organizationId,
            recipientUserId: recipient.userId,
          })),
        );
      const createdNotifications = await tx
        .insert(notifications)
        .values(
          batch.map((recipient) => ({
            organizationId: recipient.organizationId,
            recipientUserId: recipient.userId,
            recipientEmployeeId: recipient.employeeId,
            category: "system" as const,
            type: "support_announcement",
            title: data.title,
            message: data.body.slice(0, 1000),
            entityType: "support_announcement",
            entityId: announcement.id,
            actionUrl: `/app/support?announcement=${announcement.id}`,
            idempotencyKey: `support-announcement:${announcement.id}:${recipient.userId}`,
          })),
        )
        .returning({
          id: notifications.id,
          organizationId: notifications.organizationId,
        });
      if (createdNotifications.length)
        await tx
          .insert(notificationDeliveries)
          .values(
            createdNotifications.map((notification) => ({
              organizationId: notification.organizationId,
              notificationId: notification.id,
              channel: "in_app" as const,
              status: "sent" as const,
              sentAt: new Date(),
            })),
          );
    }
    await recordAuditInTransaction(tx, {
      actorUserId: actor.id,
      action: "support_announcement_published",
      resource: "support_announcement",
      resourceId: announcement.id,
      metadata: {
        actorRole: actor.platformRole,
        audienceType: data.audience.type,
      },
    });
    await recordAuditInTransaction(tx, {
      actorUserId: actor.id,
      action: "support_announcement_recipient_snapshot_created",
      resource: "support_announcement",
      resourceId: announcement.id,
      metadata: {
        actorRole: actor.platformRole,
        recipientCount: recipients.length,
        audienceType: data.audience.type,
      },
    });
    return { announcement, recipientCount: recipients.length };
  });
}

export async function listPlatformSupportAnnouncements() {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportAnnouncementView,
  );
  return withPlatformTransaction(async (tx) => {
    const announcements = await tx
      .select()
      .from(supportAnnouncements)
      .orderBy(desc(supportAnnouncements.publishedAt))
      .limit(100);
    if (!announcements.length) return [];
    const ids = announcements.map((item) => item.id);
    const countRows = await tx
      .select({ announcementId: supportAnnouncementRecipients.announcementId })
      .from(supportAnnouncementRecipients)
      .where(inArray(supportAnnouncementRecipients.announcementId, ids));
    return announcements.map((announcement) => ({
      ...announcement,
      recipientCount: countRows.filter(
        (item) => item.announcementId === announcement.id,
      ).length,
    }));
  });
}

export async function listSupportAnnouncementRecipients(
  announcementId: string,
) {
  await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportAnnouncementView,
  );
  return withPlatformTransaction(async (tx) => {
    const [announcement] = await tx
      .select({ id: supportAnnouncements.id })
      .from(supportAnnouncements)
      .where(eq(supportAnnouncements.id, announcementId))
      .limit(1);
    if (!announcement)
      throw new AppError("NOT_FOUND", "Announcement was not found.", 404);
    return tx
      .select({
        organizationId: supportAnnouncementRecipients.organizationId,
        organizationName: organizations.name,
        userId: users.id,
        fullName: users.fullName,
        email: users.email,
        createdAt: supportAnnouncementRecipients.createdAt,
        readAt: notifications.readAt,
      })
      .from(supportAnnouncementRecipients)
      .innerJoin(
        organizations,
        eq(organizations.id, supportAnnouncementRecipients.organizationId),
      )
      .innerJoin(
        users,
        eq(users.id, supportAnnouncementRecipients.recipientUserId),
      )
      .leftJoin(
        notifications,
        and(
          eq(notifications.entityType, "support_announcement"),
          eq(notifications.entityId, announcementId),
          eq(
            notifications.organizationId,
            supportAnnouncementRecipients.organizationId,
          ),
          eq(
            notifications.recipientUserId,
            supportAnnouncementRecipients.recipientUserId,
          ),
        ),
      )
      .where(eq(supportAnnouncementRecipients.announcementId, announcementId))
      .orderBy(organizations.name, users.fullName)
      .limit(1000);
  });
}

export async function downloadPlatformSupportAttachment(attachmentId: string) {
  const actor = await authorizeSupportCommunication(
    PLATFORM_PERMISSIONS.supportAttachmentAccess,
  );
  const file = await withPlatformTransaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(supportAttachments)
      .where(eq(supportAttachments.id, attachmentId))
      .limit(1);
    if (!row || row.scanStatus !== "clean")
      throw new AppError("NOT_FOUND", "Attachment was not found.", 404);
    const bytes = await getStorageProvider().download(row.storageKey);
    await recordAuditInTransaction(tx, {
      actorUserId: actor.id,
      organizationId: row.organizationId,
      action: "support_attachment_accessed",
      resource: "support_attachment",
      resourceId: row.id,
      metadata: {
        actorRole: actor.platformRole,
        submissionId: row.submissionId,
      },
    });
    return { bytes, fileName: row.fileName, mimeType: row.mimeType };
  });
  return file;
}

export async function downloadMySupportAttachment(input: {
  organizationId: string;
  userId: string;
  userRole: string;
  attachmentId: string;
}) {
  await requireStaff(input.organizationId, input.userId);
  return withStaffTransaction(
    input.organizationId,
    input.userId,
    async (tx) => {
      const [row] = await tx
        .select({
          attachment: supportAttachments,
          submission: supportSubmissions,
        })
        .from(supportAttachments)
        .innerJoin(
          supportSubmissions,
          and(
            eq(supportSubmissions.id, supportAttachments.submissionId),
            eq(
              supportSubmissions.organizationId,
              supportAttachments.organizationId,
            ),
          ),
        )
        .where(
          and(
            eq(supportAttachments.id, input.attachmentId),
            eq(supportAttachments.organizationId, input.organizationId),
            eq(supportSubmissions.submitterUserId, input.userId),
          ),
        )
        .limit(1);
      if (!row || row.attachment.scanStatus !== "clean")
        throw new AppError("NOT_FOUND", "Attachment was not found.", 404);
      const bytes = await getStorageProvider().download(
        row.attachment.storageKey,
      );
      await recordAuditInTransaction(tx, {
        actorUserId: input.userId,
        organizationId: input.organizationId,
        action: "support_attachment_accessed",
        resource: "support_attachment",
        resourceId: row.attachment.id,
        metadata: {
          actorRole: input.userRole,
          submissionId: row.submission.id,
        },
      });
      return {
        bytes,
        fileName: row.attachment.fileName,
        mimeType: row.attachment.mimeType,
      };
    },
  );
}
