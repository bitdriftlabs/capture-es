import { log, SerializableLogFields } from './log';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

export const logAt = (
  log_level: LogLevel,
  message: string,
  fields?: SerializableLogFields,
) => log(LOG_LEVEL_MAP[log_level], message, fields);
