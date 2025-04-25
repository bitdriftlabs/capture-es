export const LogLevel = Object.freeze({
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
});

export type LogLevel = keyof typeof LogLevel;

export type Serializable =
  | string
  | number
  | boolean
  | null
  | undefined
  | Serializable[]
  | { [key: string]: Serializable };

export type SerializableLogFields = { [key: string]: Serializable };

export const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

export type BaseLogFunction = (
  level: number,
  message: string,
  fields?: SerializableLogFields,
) => void;
