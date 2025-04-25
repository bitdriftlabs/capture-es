import stringify from 'fast-json-stringify';
import { Serializable } from './types';

export const serialize = (value: Serializable): string =>
  typeof value === 'string' ? value : stringify({})(value);
