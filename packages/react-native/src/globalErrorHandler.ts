// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { logInternal } from './log';
import NativeBdReactNative from './NativeBdReactNative';

type ErrorUtilsType = {
  setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
  getGlobalHandler?: () => ((error: unknown, isFatal?: boolean) => void) | undefined;
};

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
      // Process error with symbolication (if available) and pass to native layer
      processJsError(error, (name, message, stack) => {

        const isFatalIssue = Boolean(isFatal)
        NativeBdReactNative.reportJsError(name, message, stack, isFatalIssue);
         
        // TODO(Fran). To remove. For now, temporary log via standard logging
        const logMessage = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown JS error';
        const logStack = error instanceof Error ? stack : undefined;
        logInternal('error', "Global JS Error", {
          source: 'js',
          isFatal: isFatalIssue,
          message: logMessage,
          stack: logStack,
        });

      });
      
    } catch(errorAtProcessing) {
      // Modules don't exist, can't be loaded, or functions aren't available
      console.error('Previous error handler failed:', errorAtProcessing);
    }finally {
      // Always forward to the previous handler; guard against its failures
      try {
        previousHandler?.(error, isFatal);
      } catch(previousHandlerError) {
        // Log error from previous handler to avoid silent failures
        console.error('Previous error handler failed:', previousHandlerError);
      }
    }
  });
}

/**
 * Attempts to symbolicate the error stack trace using React Native's internal APIs.
 * Passes name, message, and stack separately to the native layer.
 * Additional demystification will happen on the backend with uploaded sourcemaps.
 */
function processJsError(
  error: unknown,
  onProcessed: (name: string, message: string, stack: string) => void,
): void {
  if (!(error instanceof Error)) {
    onProcessed('Error', String(error), '');
    return;
  }

  const name = error.name || 'Error';
  const message = error.message || '';
  const rawStack = error.stack || '';

  // If no stack available, pass empty stack
  if (!rawStack) {
    onProcessed(name, message, '');
    return;
  }

  // Try to symbolicate the stack trace using React Native's internal APIs
  let symbolicationAttempted = false;

  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - React Native internal API (may not exist in all versions)
    const parseErrorStackModule = require('react-native/Libraries/Core/Devtools/parseErrorStack');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - React Native internal API (may not exist in all versions)
    const symbolicateStackTraceModule = require('react-native/Libraries/Core/Devtools/symbolicateStackTrace');

    // Handle React Native version differences:
    // - React Native 0.79+: default export
    // - React Native 0.78 and below: direct function
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const parseErrorStack =
      parseErrorStackModule.default && typeof parseErrorStackModule.default === 'function'
        ? parseErrorStackModule.default
        : parseErrorStackModule;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const symbolicateStackTrace =
      symbolicateStackTraceModule.default && typeof symbolicateStackTraceModule.default === 'function'
        ? symbolicateStackTraceModule.default
        : symbolicateStackTraceModule;

    if (typeof parseErrorStack === 'function' && typeof symbolicateStackTrace === 'function') {
      const parsedFrames = parseErrorStack(rawStack);

      if (parsedFrames && parsedFrames.length > 0) {
        symbolicationAttempted = true;
        
        symbolicateStackTrace(parsedFrames)
          .then((symbolicated: unknown) => {
            const symbolicatedFrames = Array.isArray(symbolicated)
              ? symbolicated
              : ((symbolicated as { stack?: unknown[] })?.stack || []);

            if (symbolicatedFrames && symbolicatedFrames.length > 0) {
              // Reconstruct stack with symbolicated source file paths
              // Format matches Metro's default stack trace format
              let symbolicatedStack = '';
              // eslint-disable @typescript-eslint/no-unsafe-member-access
              for (const frame of symbolicatedFrames) {
                const frameObj = frame as { file?: string; lineNumber?: number | null; column?: number | null; methodName?: string };
                const location = frameObj.file || 'unknown';
                const line = frameObj.lineNumber != null ? `:${frameObj.lineNumber}` : '';
                const col = frameObj.column != null ? `:${frameObj.column}` : '';
                const methodName = frameObj.methodName || 'unknown';
                symbolicatedStack += `${methodName} at ${location}${line}${col}\n`;
              }
              onProcessed(name, message, symbolicatedStack);
            } else {
              // Symbolication returned empty, use raw stack
              onProcessed(name, message, rawStack);
            }
          })
          .catch(() => {
            // Symbolication failed (network error, timeout, etc.), use raw stack
            onProcessed(name, message, rawStack);
          });
        return;
      }
    }
  } catch {
    // Modules don't exist, can't be loaded, or functions aren't available
    // (e.g., in production builds, different RN versions, or APIs removed)
    // Fall through to use raw stack
  }

  // Fallback: use raw stack if symbolication is unavailable or failed
  // Only call if we didn't attempt symbolication (to avoid duplicate calls)
  if (!symbolicationAttempted) {
    onProcessed(name, message, rawStack);
  }
}

function getErrorUtils(): ErrorUtilsType | undefined {
  const g = global as unknown as { ErrorUtils?: ErrorUtilsType };
  return g.ErrorUtils;
}
