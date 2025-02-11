// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { initRenderer } from '@bitdrift/electron/renderer';

initRenderer({
  autoExposeInMainWorld: {
    key: 'logger',
  },
  experimental: {
    sessionReplayConfiguration: {
      frequency: 3000,
    },
  },
});
