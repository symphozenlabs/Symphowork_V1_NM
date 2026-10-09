import { AsyncLocalStorage } from "node:async_hooks";
import type { users } from "@/db/schema";

type RequestUser = typeof users.$inferSelect;
const storage = new AsyncLocalStorage<RequestUser>();

export function withRequestUser<T>(user: RequestUser, callback: () => Promise<T>) {
  return storage.run(user, callback);
}

export function getRequestUser() {
  return storage.getStore() ?? null;
}
