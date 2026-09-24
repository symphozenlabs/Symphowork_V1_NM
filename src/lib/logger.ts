type LogLevel = "debug" | "info" | "warn" | "error";
type LogContext = Record<string, unknown>;

function write(level: LogLevel, event: string, context: LogContext = {}) {
  const entry = { timestamp: new Date().toISOString(), level, event, ...context };
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  debug: (event: string, context?: LogContext) => write("debug", event, context),
  info: (event: string, context?: LogContext) => write("info", event, context),
  warn: (event: string, context?: LogContext) => write("warn", event, context),
  error: (event: string, context?: LogContext) => write("error", event, context),
};
