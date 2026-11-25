import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, PATCH } from './route';

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  getDocumentDownload: vi.fn(),
  updateDocumentStatus: vi.fn()
}));

vi.mock('@/modules/tenancy/context', () => ({
  resolveTenantContext: mocks.resolveTenantContext
}));

vi.mock('@/modules/documents/service', () => ({
  getDocumentDownload: mocks.getDocumentDownload,
  updateDocumentStatus: mocks.updateDocumentStatus
}));

describe('private employee document download route', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([{ status: 'arbitrary' }, { status: 'verified', comment: 42 }, null, {}])('rejects invalid review input before mutation: %j', async body => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: { id: 'org-qa' }, user: { id: 'user-qa' } });
    const response = await PATCH(new Request('http://localhost/api/app/documents/doc-qa', { method: 'PATCH', body: JSON.stringify(body) }), { params: { documentId: 'doc-qa' } });
    expect(response.status).toBe(400);
    expect(mocks.updateDocumentStatus).not.toHaveBeenCalled();
  });

  it('forwards an accepted review with server-resolved organization and actor', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: { id: 'org-qa' }, user: { id: 'user-qa' } });
    mocks.updateDocumentStatus.mockResolvedValue({ id: 'doc-qa', status: 'verified' });
    const response = await PATCH(new Request('http://localhost/api/app/documents/doc-qa', { method: 'PATCH', body: JSON.stringify({ status: 'verified', comment: 'Reviewed' }) }), { params: { documentId: 'doc-qa' } });
    expect(response.status).toBe(200);
    expect(mocks.updateDocumentStatus).toHaveBeenCalledWith({ organizationId: 'org-qa', actorUserId: 'user-qa', documentId: 'doc-qa', status: 'verified', comment: 'Reviewed' });
  });

  it('requires organization context before issuing a signed URL', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: null, user: { id: 'user-qa' } });

    const response = await GET(new Request('http://localhost/api/app/documents/doc-qa'), {
      params: { documentId: 'doc-qa' }
    });

    expect(response.status).toBe(403);
    expect(mocks.getDocumentDownload).not.toHaveBeenCalled();
  });

  it('prevents caching a response containing a signed URL', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: { id: 'org-qa' }, user: { id: 'user-qa' } });
    mocks.getDocumentDownload.mockResolvedValue({ url: 'https://storage.invalid/signed' });

    const response = await GET(new Request('http://localhost/api/app/documents/doc-qa'), {
      params: { documentId: 'doc-qa' }
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.getDocumentDownload).toHaveBeenCalledWith({
      organizationId: 'org-qa',
      userId: 'user-qa',
      documentId: 'doc-qa'
    });
  });
});
