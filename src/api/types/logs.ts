export const LOG_LEVELS = [
  "trace",
  "debug",
  "info",
  "warning",
  "error",
  "fatal",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export type LogEntry = {
  seq: number;
  ts: number; // Unix ms
  level: LogLevel;
  component: string | null;
  properties: Record<string, string | number | boolean | null>;
  message: string;
};

export type LogFilters = {
  min_level?: LogLevel;
  component?: string;
  plugin_id?: number;
};

export type LogsList = {
  entries: LogEntry[];
  cursor: number;
  run_id: string;
};
