import { describe, expect, it } from 'vitest';
import { shouldPollChatUnread } from './unread-event';

describe('chat unread polling', () => {
  it('skips chat routes because the chat workspace owns sidebar refresh there', () => {
    expect(shouldPollChatUnread('/app/chat', false)).toBe(false);
    expect(shouldPollChatUnread('/app/chat/conversation-1', false)).toBe(false);
  });

  it('polls on visible non-chat routes only', () => {
    expect(shouldPollChatUnread('/app', false)).toBe(true);
    expect(shouldPollChatUnread('/app/chatter', false)).toBe(true);
    expect(shouldPollChatUnread('/app', true)).toBe(false);
  });
});
