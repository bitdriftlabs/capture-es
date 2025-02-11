// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { ipcRenderer } from 'electron';
import { type AutoExposeOptions } from './autoExposeInMainWorld';
import { buildChannelName } from '../utils';
import { BitdriftChannels, BitdriftLogLevels } from '../constants';
import { captureScreen } from './replay';

export type AddSessionReplayCaptureOptions = {
  /**
   * How often to send a snapshot of the DOM to the main process, in milliseconds.
   * @default 3000
   * */
  frequency?: number;
  /**
   * The target global window object to capture from.
   * @default window
   */
  targetWindow?: Window;
} & Pick<AutoExposeOptions, 'channelPrefix'>;

const DEFAULT_INTERVAL = 3000;

export const addSessionReplayCapture = (
  options?: AddSessionReplayCaptureOptions,
) => {
  const targetWindow = options?.targetWindow ?? window;
  const interval = options?.frequency ?? DEFAULT_INTERVAL;
  let lastTick = Date.now();

  const tick = () => {
    const now = Date.now();
    if (now - lastTick > interval) {
      lastTick = now;
      try {
        const screen = captureScreen(targetWindow);
        ipcRenderer.send(
          buildChannelName(BitdriftChannels.replay, options?.channelPrefix),
          screen,
        );
      } catch (e: unknown) {
        ipcRenderer.send(
          buildChannelName(BitdriftChannels.log, options?.channelPrefix),
          BitdriftLogLevels.error,
          'Failed to capture screen',
          { error: e },
        );
      }
    }

    targetWindow.requestIdleCallback(tick);
  };

  targetWindow.requestIdleCallback(tick);
};
