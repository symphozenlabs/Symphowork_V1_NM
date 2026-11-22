import { AsyncLocalStorage } from 'node:async_hooks';

export interface CookieEntry {
  name: string;
  value: string;
}

export interface CookieStore {
  get(name: string): CookieEntry | undefined;
  set(name: string, value: string, options?: any): void;
  delete(name: string, options?: any): void;
}

export const requestCookieStorage = new AsyncLocalStorage<CookieStore>();

export async function cookies(): Promise<CookieStore> {
  const store = requestCookieStorage.getStore();
  if (!store) {
    throw new Error('cookies() called outside request scope');
  }
  return store;
}
