import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageProvider } from './local';

const mocks = vi.hoisted(() => ({ readFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ default: { readFile: mocks.readFile } }));

describe('local storage directory containment', () => {
  it('rejects a sibling path sharing the storage directory prefix before reading bytes', async () => {
    const root = path.resolve('isolated-storage');
    const sibling = `${root}-outside/file.pdf`;
    const provider = createLocalStorageProvider(root);
    await expect(provider.download(sibling)).rejects.toMatchObject({ status: 400 });
    expect(mocks.readFile).not.toHaveBeenCalled();
  });
});
