import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const mocks = vi.hoisted(() => ({
  resolveTenantContext: vi.fn(),
  getResumeDownload: vi.fn()
}));

vi.mock('@/modules/tenancy/context', () => ({
  resolveTenantContext: mocks.resolveTenantContext
}));

vi.mock('@/modules/resume-intelligence/service', () => ({
  getResumeDownload: mocks.getResumeDownload
}));

describe('private candidate resume download route', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires organization context before issuing a signed URL', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: null, user: { id: 'user-qa' } });

    const response = await GET(new Request('http://localhost/api/app/ats/resumes/doc-qa/download'), {
      params: Promise.resolve({ documentId: 'doc-qa' })
    });

    expect(response.status).toBe(403);
    expect(mocks.getResumeDownload).not.toHaveBeenCalled();
  });

  it('prevents caching a response containing a signed URL', async () => {
    mocks.resolveTenantContext.mockResolvedValue({ organization: { id: 'org-qa' }, user: { id: 'user-qa' } });
    mocks.getResumeDownload.mockResolvedValue({
      url: 'https://storage.invalid/signed',
      document: { id: 'doc-qa', fileName: 'resume.pdf', parsingStatus: 'complete' }
    });

    const response = await GET(new Request('http://localhost/api/app/ats/resumes/doc-qa/download'), {
      params: Promise.resolve({ documentId: 'doc-qa' })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(mocks.getResumeDownload).toHaveBeenCalledWith({
      organizationId: 'org-qa',
      userId: 'user-qa',
      documentId: 'doc-qa'
    });
  });
});
