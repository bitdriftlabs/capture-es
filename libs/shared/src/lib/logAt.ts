import {
  BaseLogFunction,
  LOG_LEVEL_MAP,
  LogLevel,
  SerializableLogFields,
} from './types';

export const buildLogAt =
  (log: BaseLogFunction) =>
  (logLevel: LogLevel, message: string, fields?: SerializableLogFields) =>
    log(LOG_LEVEL_MAP[logLevel], message, fields);
