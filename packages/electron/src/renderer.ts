// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import {
  addSessionReplayCapture,
  type AddSessionReplayCaptureOptions,
} from './lib/addSessionReplayCapture';
import {
  autoExposeInMainWorld,
  type AutoExposeOptions,
} from './lib/autoExposeInMainWorld';

export type InitRendererOptions = {
  /** Whether to automatically expose the logger in the main world. Defaults to false. */
  autoExposeInMainWorld?: boolean | AutoExposeOptions;
  /** Whether to enable session replay, and with what options. Defaults to false. */
  sessionReplayConfiguration?:
    | boolean
    | Pick<AddSessionReplayCaptureOptions, 'frequency'>;
};

export const initRenderer = (options: InitRendererOptions) => {
  if (options.autoExposeInMainWorld) {
    autoExposeInMainWorld(
      typeof options.autoExposeInMainWorld === 'boolean'
        ? {}
        : options.autoExposeInMainWorld,
    );
  }

  if (options.sessionReplayConfiguration) {
    addSessionReplayCapture(window);
  }
};
