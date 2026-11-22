import { AsyncLocalStorage } from 'node:async_hooks';

export interface PerfContext {
  reqId: string;
  url?: string;
  method?: string;
  startTime: number;
}

export const perfStorage = new AsyncLocalStorage<PerfContext>();

export function getPerfContext(): PerfContext | undefined {
  return perfStorage.getStore();
}

export function logPerf(category: string, message: string, durationMs?: number, status?: number | string, slowThresholdMs = 400) {
  const ctx = getPerfContext();
  const id = ctx ? `[${ctx.reqId}] ` : '';
  const ts = new Date().toISOString().slice(11, 23); // HH:mm:ss.sss

  let line = `[${ts}] [PERF]${id}${category} ${message}`;
  if (status !== undefined) {
    line += ` | ${status}`;
  }
  if (durationMs !== undefined) {
    line += ` | ${durationMs.toFixed(1)} ms`;
    if (durationMs >= slowThresholdMs) {
      line += ` [SLOW >= ${slowThresholdMs}ms]`;
    }
  }

  console.log(line);
}
