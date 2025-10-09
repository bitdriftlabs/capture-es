// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { log } from './index';

type ErrorUtilsType = {
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
};

function getErrorUtils(): ErrorUtilsType | undefined {
  const g = global as unknown as { ErrorUtils?: ErrorUtilsType };
  return g.ErrorUtils;
}

export function installGlobalErrorHandler(): void {
  
  const ErrorUtilsGlobal = getErrorUtils();

  if (
    !ErrorUtilsGlobal ||
    typeof ErrorUtilsGlobal.setGlobalHandler !== 'function' ||
    typeof ErrorUtilsGlobal.getGlobalHandler !== 'function'
  ) {
    return;
  }

  const previousHandler = ErrorUtilsGlobal.getGlobalHandler?.();

  ErrorUtilsGlobal.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    try {
      const message = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown JS error';
      const stack = error instanceof Error ? error.stack : undefined;
      
      // TODO:FranAguilera. For now logging as regular log. Next steps will be to send this to the processing pipeline
      log('error', "Global JS Error", {
        source: 'js',
        isFatal: Boolean(isFatal),
        message,
        stack,
      });

    } finally {
      // Always forward to the previous handler; guard against its failures
      try {
        previousHandler?.(error, isFatal);
      } catch {
        // Ignore errors from previous handler
      }
    }
  });
}


