// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

/**
 * Processes JavaScript errors by attempting symbolication in debug builds
 * and formatting stack traces for backend symbolication in release builds.
 * 
 * @param error - The error object to process
 * @param onProcessed - Callback invoked with processed error name, message, and stack
 */
export function processJsError(
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

  if (!rawStack) {
    return;
  }

  // Only attempt symbolication in debug builds
  // In release builds, format the raw stack trace for backend symbolication
  if (__DEV__) {
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
                // Symbolication returned empty, format raw stack
                const formattedStack = formatRawStack(rawStack);
                onProcessed(name, message, formattedStack);
              }
            })
            .catch(() => {
              // Symbolication failed (network error, timeout, etc.), format raw stack
              const formattedStack = formatRawStack(rawStack);
              onProcessed(name, message, formattedStack);
            });
          return;
        }
      }
    } catch {
      // Modules don't exist, can't be loaded, or functions aren't available
      // Fall through to format raw stack
    }

    // Fallback: format raw stack if symbolication is unavailable or failed
    // Only call if we didn't attempt symbolication (to avoid duplicate calls)
    if (!symbolicationAttempted) {
      const formattedStack = formatRawStack(rawStack);
      onProcessed(name, message, formattedStack);
    }
  } else {
    // Release build: format raw stack trace for backend symbolication
    const formattedStack = formatRawStack(rawStack);
    onProcessed(name, message, formattedStack);
  }
}

/**
 * Formats raw JavaScript stack trace for backend symbolication.
 * Converts stack frames to format: "at <functionName> (address at <bundle>:<line>:<column>)"
 * 
 * @param rawStack - The raw stack trace string
 * @returns Formatted stack trace string
 */
export function formatRawStack(rawStack: string): string {
  // Stack trace format examples:
  // "Error\n    at triggerGlobalJsError (index.android.bundle:1:726441)\n    at ..."
  // "Error\n    at triggerGlobalJsError (file:///path/to/index.bundle.js:123:45)\n    at ..."
  
  const lines = rawStack.split('\n');
  const formattedLines: string[] = [];
  
  for (const line of lines) {
    if (!line.trim() || !line.includes('at ')) {
      continue;
    }
    
    // Match patterns like:
    // "    at functionName (file:line:column)"
    // "    at functionName (bundle.js:line:column)"
    // "    at functionName (address at file:line:column)" - handle already formatted
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    
    if (match) {
      const functionName = match[1].trim();
      let filePath = match[2].trim();
      const lineNum = match[3];
      const column = match[4];
      
      // Remove any "address at " prefix if already present (to avoid duplication)
      // Use a more aggressive regex to remove all occurrences at the start
      filePath = filePath.replace(/^(address\s+at\s+)+/gi, '').trim();
      
      // Extract bundle name (e.g., "index.android.bundle" from full path)
      // Handle cases where file might already be just the bundle name
      let bundleName = filePath.includes('/') ? filePath.split('/').pop() || filePath : filePath;
      
      // Ensure bundle name doesn't have "address at " prefix (defensive check)
      bundleName = bundleName.replace(/^(address\s+at\s+)+/gi, '').trim();
      
      // Format: "at functionName (address at bundle:line:column)"
      // Only add "address at " if bundleName doesn't already start with it
      const location = bundleName.startsWith('address at ') 
        ? bundleName 
        : `address at ${bundleName}`;
      
      formattedLines.push(`at ${functionName} (${location}:${lineNum}:${column})`);
    } else {
      const simpleMatch = line.match(/at\s+(.+)/);
      if (simpleMatch) {
        formattedLines.push(`at ${simpleMatch[1]}`);
      }
    }
  }
  
  return formattedLines.join('\n');
}

