import { z } from "zod";
import { AppError } from "@/lib/errors";

export const createConversationSchema = z
  .object({
    type: z.enum(["direct", "group"] as const, {
      message: "Conversation type must be either 'direct' or 'group'.",
    }),
    name: z.string().trim().max(180, "Conversation name cannot exceed 180 characters.").optional(),
    employeeIds: z
      .array(z.string().uuid("Invalid employee ID format."))
      .min(1, "At least one participant employee ID is required."),
  })
  .superRefine((data, ctx) => {
    if (data.type === "group") {
      if (!data.name || data.name.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["name"],
          message: "Group conversation name is required.",
        });
      }
    }
    if (data.type === "direct") {
      const unique = new Set(data.employeeIds);
      if (unique.size > 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["employeeIds"],
          message: "Direct conversations cannot have more than two participants.",
        });
      }
    }
  });

export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const sendMessageSchema = z
  .object({
    content: z.string().max(10000, "Message content cannot exceed 10000 characters.").optional(),
    type: z.enum(["text", "file", "system", "task_reference"]).default("text"),
    replyToMessageId: z.string().uuid("Invalid reply-to message ID format.").optional().nullable(),
    clientIdempotencyKey: z
      .string()
      .trim()
      .max(180, "Client idempotency key cannot exceed 180 characters.")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "file") {
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Message content is required.",
        });
      }
    }
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const conversationIdParamSchema = z.string().uuid("Invalid conversation ID format.");
export const messageIdParamSchema = z.string().uuid("Invalid message ID format.");

export const signalTypingSchema = z.object({
  isTyping: z.boolean(),
});

export const updatePresenceSchema = z.object({
  status: z.enum(["online", "away", "busy", "offline"]).default("online"),
});

export const ALLOWED_REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
export type AllowedReactionEmoji = (typeof ALLOWED_REACTION_EMOJIS)[number];

export const toggleReactionSchema = z.object({
  emoji: z.enum(ALLOWED_REACTION_EMOJIS, {
    message: "Invalid emoji. Allowed reactions are: 👍, ❤️, 😂, 😮, 😢, 🙏.",
  }),
});

export const searchMessagesSchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Search query must be at least 2 characters.")
    .max(100, "Search query cannot exceed 100 characters."),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const attachmentIdParamSchema = z.string().uuid("Invalid attachment ID format.");

export function parseBody<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const pathPrefix = firstIssue.path.length ? `${firstIssue.path.join(".")}: ` : "";
    throw new AppError("VALIDATION_ERROR", `${pathPrefix}${firstIssue.message}`, 400);
  }
  return result.data;
}

