import { Logger } from '@bitdrift/core';

export type LoggerInstance = Logger;

export type LogParams = Parameters<LoggerInstance['log']>;

export type LogFields = LogParams[2];

export type RequiredAttributes<T, K extends keyof T> = T & Required<Pick<T, K>>;
