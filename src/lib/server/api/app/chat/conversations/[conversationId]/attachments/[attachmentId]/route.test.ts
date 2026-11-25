import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  getChatAttachment: vi.fn()
}));

vi.mock('@/modules/tenancy/context', () => ({
  resolveTenantContext: mocks.resolveTenantContext
}));

vi.mock('@/modules/collaboration/service', () => ({
  getChatAttachment: mocks.getChatAttachment
}));

describe('private chat attachment route', () => {
  const conversationId = '10000000-0000-4000-8000-000000000001';
  const attachmentId = '10000000-0000-4000-8000-000000000002';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing organization context before reading attachment bytes', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: null, user: { id: 'user-qa' } });

    const response = await GET(new Request('http://localhost/api/app/chat/conversations/test/attachments/test'), {
      params: { conversationId, attachmentId }
    });

    expect(response.status).toBe(403);
    expect(mocks.getChatAttachment).not.toHaveBeenCalled();
  });

  it('marks authenticated attachment bytes no-store', async () => {
    mocks.resolveTenantContext.mockResolvedValue({
      organization: { id: 'org-qa' },
      user: { id: 'user-qa' }
    });
    mocks.getChatAttachment.mockResolvedValue({
      attachment: { mimeType: 'image/png', fileSize: 3, fileName: 'private.png' },
      buffer: new Uint8Array([1, 2, 3])
    });

    const response = await GET(new Request('http://localhost/api/app/chat/conversations/test/attachments/test'), {
      params: { conversationId, attachmentId }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.getChatAttachment).toHaveBeenCalledWith({
      organizationId: 'org-qa',
      userId: 'user-qa',
      conversationId,
      attachmentId
    });
  });
});
