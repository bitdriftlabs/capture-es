import { buildLogAt } from './internal';
import { log } from './log';

export const logAt = buildLogAt(log);
