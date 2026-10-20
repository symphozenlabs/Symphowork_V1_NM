export const CHAT_UNREAD_EVENT = 'symphowork:chat-unread-count';

export function shouldPollChatUnread(pathname: string, isHidden: boolean): boolean {
  return !isHidden && pathname !== '/app/chat' && !pathname.startsWith('/app/chat/');
}

export function dispatchChatUnreadCount(count: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CHAT_UNREAD_EVENT, { detail: { count } }));
  }
}
