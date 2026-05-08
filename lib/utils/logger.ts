/* eslint-disable no-console */
type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const normalizeLevel = (value: string | undefined): LogLevel => {
  if (!value) {
    return process.env.NODE_ENV === "development" ? "debug" : "info";
  }

  const normalized = value.toLowerCase();
  if (normalized === "debug" || normalized === "info" || normalized === "warn" || normalized === "error") {
    return normalized;
  }

  return process.env.NODE_ENV === "development" ? "debug" : "info";
};

const ACTIVE_LEVEL = normalizeLevel(process.env.LOG_LEVEL);

const shouldLog = (level: LogLevel): boolean => LEVEL_RANK[level] >= LEVEL_RANK[ACTIVE_LEVEL];

const normalizeValue = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, normalizeValue(item)]);
    return Object.fromEntries(entries);
  }

  return value;
};

const emit = (level: LogLevel, event: string, payload?: Record<string, unknown>): void => {
  if (!shouldLog(level)) {
    return;
  }

  const normalizedPayload = payload ? (normalizeValue(payload) as Record<string, unknown>) : {};

  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    env: process.env.NODE_ENV ?? "unknown",
    ...normalizedPayload
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
};

export const logger = {
  debug: (event: string, payload?: Record<string, unknown>) => emit("debug", event, payload),
  info: (event: string, payload?: Record<string, unknown>) => emit("info", event, payload),
  warn: (event: string, payload?: Record<string, unknown>) => emit("warn", event, payload),
  error: (event: string, payload?: Record<string, unknown>) => emit("error", event, payload)
};
