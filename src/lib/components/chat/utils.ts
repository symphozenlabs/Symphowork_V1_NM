/**
 * Format timestamp for the conversation list item (e.g. 10:45 AM, Yesterday, Oct 18)
 */
export function formatConversationTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  const isSameYear = date.getFullYear() === now.getFullYear();
  if (isSameYear) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

/**
 * Format timestamp for individual message bubbles (e.g. 10:45 AM)
 */
export function formatMessageTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * Format date divider header (e.g. Today, Yesterday, Monday, Oct 19, 2026)
 */
export function formatDateDivider(dateStr?: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Yesterday";

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Extract 1-2 uppercase initials from a display name
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministically pick an avatar color palette based on string hash
 */
const AVATAR_COLOR_PALETTES = [
  { bg: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { bg: "bg-sky-100 text-sky-800 border-sky-200" },
  { bg: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  { bg: "bg-purple-100 text-purple-800 border-purple-200" },
  { bg: "bg-amber-100 text-amber-800 border-amber-200" },
  { bg: "bg-rose-100 text-rose-800 border-rose-200" },
  { bg: "bg-teal-100 text-teal-800 border-teal-200" },
  { bg: "bg-cyan-100 text-cyan-800 border-cyan-200" },
];

export function getAvatarColorClass(str?: string | null): string {
  if (!str) return AVATAR_COLOR_PALETTES[0].bg;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index].bg;
}

/**
 * Format online/offline presence label
 */
export function formatPresenceStatus(presence?: {
  status: "online" | "away" | "offline";
  lastSeenAt: string | null;
} | null): string {
  if (!presence) return "Offline";
  if (presence.status === "online") return "Online";
  if (presence.status === "away") return "Away";
  if (presence.lastSeenAt) {
    const formatted = formatConversationTime(presence.lastSeenAt);
    return formatted ? `Offline • Last seen ${formatted}` : "Offline";
  }
  return "Offline";
}

