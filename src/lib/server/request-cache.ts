import { getRequestEvent } from '$app/server';

export interface RequestCacheStore {
  fnCache: Map<Function, Map<string, any>>;
  sharedData: Map<string, any>;
}

export function getRequestCacheStore(): RequestCacheStore | undefined {
  // Non-request tasks have no shared identity or permission cache.
  try { return getRequestEvent().locals.requestCache; } catch { return undefined; }
}

export function createRequestCacheStore(): RequestCacheStore {
  return {
    fnCache: new Map(),
    sharedData: new Map()
  };
}

export function memoizeRequest<T extends (...args: any[]) => any>(fn: T): T {
  return function (this: any, ...args: any[]) {
    const store = getRequestCacheStore();
    if (!store) {
      return fn.apply(this, args);
    }
    let fnMap = store.fnCache.get(fn);
    if (!fnMap) {
      fnMap = new Map<string, any>();
      store.fnCache.set(fn, fnMap);
    }
    let key: string;
    if (args.length === 0) {
      key = '__NO_ARGS__';
    } else if (args.length === 1 && (typeof args[0] === 'string' || typeof args[0] === 'number')) {
      key = String(args[0]);
    } else {
      try {
        key = JSON.stringify(args);
      } catch {
        key = String(args[0]);
      }
    }
    if (fnMap.has(key)) {
      return fnMap.get(key);
    }
    const result = fn.apply(this, args);
    fnMap.set(key, result);
    return result;
  } as T;
}
