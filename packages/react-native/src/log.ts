import type { LogFields, Serializable } from './NativeBdReactNative';
import stringify from 'fast-json-stringify';
import NativeBdReactNative from './NativeBdReactNative';

export type SerializableLogFields = { [key: string]: Serializable };

export const log = (
  level: number,
  message: string,
  fields?: SerializableLogFields,
): void =>
  NativeBdReactNative.log(
    level,
    message,
    fields
      ? Object.entries(fields).reduce<LogFields>(
          (acc, [key, value]) => ({
            ...acc,
            [key]: typeof value === 'string' ? value : stringify({})(value),
          }),
          {},
        )
      : undefined,
  );
