// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { Logger } from '@bitdrift/core';
import { constructArrayBuffer } from '@bitdrift/dom';
import { ipcMain } from 'electron';

/**
 * Options for automatically exposing objects in the main world.
 */
export type AutoExposeOptions = Partial<{
  /** The prefix to use for the channel names. Defaults to ''. */
  channelPrefix: string;
}>;

const DEFAULT_OPTIONS: AutoExposeOptions = {
  channelPrefix: undefined,
};

const buildChannelName = (tail: string, prefix?: string) =>
  [prefix, 'bitdrift', tail].filter(Boolean).join(':');

export const autoAddListener = (
  logger: InstanceType<typeof Logger>,
  options?: AutoExposeOptions,
) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Wire up the IPC channel to the logger
  const logChannel = buildChannelName('log', mergedOptions.channelPrefix);
  ipcMain.on(logChannel, (_, level, message, fields) => {
    logger.log(level, message, fields ?? {});
  });

  // Wire up the IPC channel to the logger
  const replayChannel = buildChannelName('replay', mergedOptions.channelPrefix);
  ipcMain.on(
    replayChannel,
    (_, screen: [number, number, number, number, number][]) => {
      const screenBuffer = constructArrayBuffer(screen);
      logger.log(2, 'Screen captured', {
        log_type: 1,
        screen: Buffer.from(screenBuffer),
      });
    },
  );
};
