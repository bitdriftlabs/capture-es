// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { ipcRenderer } from 'electron';
import { captureScreen } from '@bitdrift/dom';
import { type AutoExposeOptions } from './autoExposeInMainWorld';
import { buildChannelName } from './utils';
import { BitdriftChannels } from './constants';

export type AddSessionReplayCaptureOptions = {
  /**
   * How often to send a snapshot of the DOM to the main process, in milliseconds.
   * @default 3000
   * */
  frequency?: number;
} & Pick<AutoExposeOptions, 'channelPrefix'>;

const DEFAULT_INTERVAL = 3000;

export const addSessionReplayCapture = (
  targetWindow: Window,
  options?: AddSessionReplayCaptureOptions,
) => {
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
      } catch {
        // TODO: log error
        ipcRenderer;
      }
    }

    targetWindow.requestIdleCallback(tick);
  };

  targetWindow.requestIdleCallback(tick);
};
