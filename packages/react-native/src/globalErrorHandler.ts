// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { log } from './index';
import { ErrorUtils } from 'react-native';

export function installGlobalErrorHandler(): void {
  
  if (
    !ErrorUtils ||
    typeof ErrorUtils.setGlobalHandler !== 'function' ||
    typeof ErrorUtils.getGlobalHandler !== 'function'
  ) {
    return;
  }

  const previousHandler = ErrorUtils.getGlobalHandler?.();

  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
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

    } catch(error){
      console.error('Failed to log global error:', error);
      
    }finally {
      // Always forward to the previous handler; guard against its failures
      try {
        previousHandler?.(error, isFatal);
      } catch (previousHandlerError) {
        // Log error from previous handler to avoid silent failures
        console.error('Previous error handler failed:', previousHandlerError);
      }
    }
  });
}


