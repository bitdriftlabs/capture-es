// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import {
  autoExposeInMainWorld,
  type AutoExposeOptions,
} from './lib/autoExposeInMainWorld';

export type InitRendererOptions = {
  autoExposeInMainWorld?: boolean | AutoExposeOptions;
};

export const initRenderer = (options: InitRendererOptions) => {
  if (options.autoExposeInMainWorld) {
    autoExposeInMainWorld(
      typeof options.autoExposeInMainWorld === 'boolean'
        ? {}
        : options.autoExposeInMainWorld,
    );
  }
};
