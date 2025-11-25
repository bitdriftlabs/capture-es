// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import { logInternal } from './log';
import NativeBdReactNative from './NativeBdReactNative';
import { processJsError } from './jsErrorProcessor';

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
    // Capture the isFatal value from React Native's error handler
    // This reflects whether React Native considers the error fatal
    // Note: Architecture determines actual crash behavior:
    // - Old Architecture (bridge-based): crashes on fatal errors regardless of engine (Hermes/JSC)
    //   because it can't recover from invalid native bridge states
    // - New Architecture (Fabric): handles fatal errors gracefully, doesn't crash even if marked fatal
    const reactNativeIsFatal = Boolean(isFatal ?? false);
    const isNewArch = detectNewArchitecture();
    
    // Adjust isFatal based on architecture:
    // - Old Arch + isFatal=true → will crash → mark as fatal
    // - New Arch + isFatal=true → won't crash → mark as non-fatal
    // - Default to fatal if detection fails (safer - assume crashes)
    const actualIsFatal = reactNativeIsFatal && !isNewArch;
    
    try {
      processJsError(error, (name, message, stack) => {
        const engine = detectEngine()
        const libraryVersion = getLibraryVersion()
        NativeBdReactNative.reportJsError(name, message, stack, actualIsFatal, engine, libraryVersion);
      });
      
    } catch(errorAtProcessing) {
      // Modules don't exist, can't be loaded, or functions aren't available
      console.error('Previous error handler failed:', errorAtProcessing);
    }finally {
      // Always forward to the previous handler with original isFatal value
      // This preserves React Native's default behavior (crash or not)
      try {
        previousHandler?.(error, isFatal);
      } catch(previousHandlerError) {
        // Log error from previous handler to avoid silent failures
        console.error('Previous error handler failed:', previousHandlerError);
      }
    }
  });
}

  error: unknown,

function getErrorUtils(): ErrorUtilsType | undefined {
  const g = global as unknown as { ErrorUtils?: ErrorUtilsType };
  return g.ErrorUtils;
}

function detectEngine(): string {
  const g = global as unknown as { HermesInternal?: unknown };
  return g.HermesInternal != null ? 'hermes' : 'jsc';
}

/**
 * Gets the Bitdrift React Native library version.
 * Returns the version string from package.json (e.g., "0.8.1") or "unknown" if detection fails.
 */
function getLibraryVersion(): string {
  try {
    // Try to read from package.json relative to this file
    // The package.json is in the parent directory (packages/react-native/package.json)
    // From src/globalErrorHandler.ts -> ../package.json
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const packageJson = require('../package.json');
    if (packageJson && packageJson.version) {
      return packageJson.version;
    }
    
    return 'unknown';
  } catch {
    // If package.json can't be read, return unknown
    // The native layer will fallback to its own detection method
    return 'unknown';
  }
}

/**
 * Detects if React Native is using the New Architecture (Fabric/TurboModules).
 * Uses multiple detection methods in order of reliability.
 * Defaults to false (old architecture) if detection fails (safer - assumes crashes).
 */
function detectNewArchitecture(): boolean {
  try {
    const g = global as unknown as {
      RN$Bridgeless?: boolean;
      __turboModuleProxy?: unknown;
      nativeFabricUIManager?: unknown;
    };

    // Check for bridgeless mode (most definitive indicator in RN 0.74+)
    if (g.RN$Bridgeless === true) {
      return true;
    }

    // Check for TurboModule proxy (reliable indicator)
    if (g.__turboModuleProxy != null) {
      return true;
    }

    // Check for Fabric UI Manager
    if (g.nativeFabricUIManager != null) {
      return true;
    }

    // Default to old architecture if detection fails (safer - assume crashes)
    return false;
  } catch {
    // If any error occurs during detection, default to old architecture
    // This is safer as it assumes crashes will occur
    return false;
  }
}
