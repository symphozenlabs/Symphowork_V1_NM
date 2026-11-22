export type ConversationType = "direct" | "group";

export interface ProfileDetails {
  id: string;
  displayName: string;
  departmentName?: string | null;
  designationTitle?: string | null;
  presence?: { status: "online" | "away" | "offline"; lastSeenAt: string | null } | null;
}

export interface ParticipantEmployee {
  id: string;
  displayName: string;
  employeeId?: string;
  workEmail?: string | null;
  status?: string;
  departmentName?: string | null;
  designationTitle?: string | null;
  presence?: {
    status: "online" | "away" | "offline";
    lastSeenAt: string | null;
  } | null;
}

export interface ConversationItem {
  conversation: {
    id: string;
    type: ConversationType;
    name?: string | null;
    updatedAt: string;
    createdAt?: string;
    memberCount?: number;
  };
  member: {
    id: string;
    role: "owner" | "member";
    employeeId: string;
    lastReadAt?: string | null;
  };
  employee: ParticipantEmployee;
  recipient: ParticipantEmployee | null;
  unreadCount?: number;
  lastMessage?: {
    id: string;
    content: string | null;
    type: string;
    createdAt: string;
    senderDisplayName: string;
    senderEmployeeId: string;
  } | null;
}

export interface MessageSender {
  id: string;
  displayName: string;
  employeeId?: string;
  departmentName?: string | null;
  designationTitle?: string | null;
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: "image" | "document" | "audio";
}

export interface MessageReactionGroup {
  emoji: string;
  count: number;
  reactedByMe: boolean;
  employeeNames: string[];
}

export interface MessageItem {
  id: string;
  conversationId: string;
  senderEmployeeId: string;
  content?: string | null;
  type: "text" | "file" | "system" | "task_reference";
  replyToMessageId?: string | null;
  clientIdempotencyKey?: string | null;
  createdAt: string;
  updatedAt?: string;
  editedAt?: string | null;
  sender: MessageSender;
  deliveryStatus?: "sending" | "sent" | "delivered" | "read" | "failed" | null;
  sendError?: string | null;
  attachment?: MessageAttachment | null;
  reactions?: MessageReactionGroup[];
}

export interface ChatMessageSearchResult {
  id: string;
  conversationId: string;
  conversationName: string;
  conversationType: "direct" | "group";
  senderDisplayName: string;
  content: string;
  snippet: string;
  createdAt: string;
}

export interface ChatRecipient {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  workEmail?: string | null;
  departmentName?: string | null;
  designationTitle?: string | null;
}

export interface TaskProjectOption {
  id: string;
  projectNumber: string;
  name: string;
}
