// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { contextBridge, ipcRenderer } from 'electron';
import { LogFields, RequiredAttributes } from './types';
import { BitdriftLogLevels } from './constants';

/**
 * Options for automatically exposing objects in the main world.
 */
export type AutoExposeOptions = Partial<{
  /** The key to used when exposed in the main world. */
  key: string;
  /** The prefix to use for the channel names. Defaults to ''. */
  channelPrefix: string;
}>;

const DEFAULT_OPTIONS: RequiredAttributes<AutoExposeOptions, 'key'> = {
  key: 'bitdriftSDK',
  channelPrefix: undefined,
};

const buildChannelName = (tail: string, prefix?: string) =>
  [prefix, 'bitdrift', tail].filter(Boolean).join(':');

export const autoExposeInMainWorld = (options?: AutoExposeOptions) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const logChannel = buildChannelName('log', mergedOptions.channelPrefix);

  // Factory for mapping log functions
  const factory = (level: number) => (msg: string, fields: LogFields) =>
    ipcRenderer.send(logChannel, level, msg, fields);

  // Expose the logger in the main world
  contextBridge.exposeInMainWorld(mergedOptions.key, {
    trace: factory(BitdriftLogLevels.trace),
    debug: factory(BitdriftLogLevels.debug),
    info: factory(BitdriftLogLevels.info),
    warn: factory(BitdriftLogLevels.warn),
    error: factory(BitdriftLogLevels.error),
  });
};
