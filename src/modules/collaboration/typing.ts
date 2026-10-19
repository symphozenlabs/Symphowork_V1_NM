/**
 * Ephemeral In-Memory Typing Indicator Registry
 * Keeps track of active typers in conversations with short TTLs (4.5s)
 * Does not require database persistence or disk I/O.
 */

interface TypingRecord {
  employeeId: string;
  displayName: string;
  expiresAt: number;
}

// Map: conversationId -> Map<employeeId, TypingRecord>
const conversationTypers = new Map<string, Map<string, TypingRecord>>();

/**
 * Register or clear a user's typing state in a conversation
 */
export function setTypingIndicator(
  conversationId: string,
  employeeId: string,
  displayName: string,
  isTyping: boolean
): void {
  let convMap = conversationTypers.get(conversationId);
  if (!convMap) {
    convMap = new Map();
    conversationTypers.set(conversationId, convMap);
  }

  if (!isTyping) {
    convMap.delete(employeeId);
    if (convMap.size === 0) {
      conversationTypers.delete(conversationId);
    }
    return;
  }

  convMap.set(employeeId, {
    employeeId,
    displayName,
    expiresAt: Date.now() + 4500, // 4.5 seconds timeout
  });
}

/**
 * Retrieve active typing user display names for a conversation, excluding the current viewer
 */
export function getActiveTypers(
  conversationId: string,
  excludeEmployeeId?: string
): string[] {
  const convMap = conversationTypers.get(conversationId);
  if (!convMap) return [];

  const now = Date.now();
  const activeNames: string[] = [];

  for (const [empId, record] of convMap.entries()) {
    if (record.expiresAt < now) {
      convMap.delete(empId);
    } else if (empId !== excludeEmployeeId) {
      activeNames.push(record.displayName);
    }
  }

  if (convMap.size === 0) {
    conversationTypers.delete(conversationId);
  }

  return activeNames;
}

/**
 * Reset typing registry (useful in test teardown)
 */
export function clearTypingRegistry(): void {
  conversationTypers.clear();
}
