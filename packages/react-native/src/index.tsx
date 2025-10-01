import { NativeModules, Platform } from 'react-native';
import {
  logInternal,
  serialize,
  type SerializableLogFields,
  Serializable,
  LogLevel,
} from './log';
import { InitOptions, SessionStrategy, CrashReportingOptions } from './NativeBdReactNative';
import NativeBdReactNative from './NativeBdReactNative';
export { SessionStrategy, CrashReportingOptions } from './NativeBdReactNative';

let api_url: string;
let api_key: string;

const LINKING_ERROR =
  `The package '@bitdrift/react-native' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

// @ts-expect-error __turboModuleProxy is not defined
const isTurboModuleEnabled = global.__turboModuleProxy != null;

/* eslint-disable @typescript-eslint/no-var-requires */
const BdReactNativeModule = isTurboModuleEnabled
  ? require('./NativeBdReactNative').default
  : NativeModules.BdReactNative;
/* eslint-enable @typescript-eslint/no-var-requires */

const BdReactNative = BdReactNativeModule
  ? BdReactNativeModule
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      },
    );

export function init(
  key: string,
  sessionStrategy: SessionStrategy,
  options?: InitOptions,
): void {
  api_url = options?.url ?? 'api.bitdrift.io';
  api_key = key;

  return BdReactNative.init(key, sessionStrategy, options ?? {});
}

export function trace(message: string, fields?: SerializableLogFields): void {
  return logInternal('trace', message, fields);
}

export function debug(message: string, fields?: SerializableLogFields): void {
  return logInternal('debug', message, fields);
}

export function info(message: string, fields?: SerializableLogFields): void {
  return logInternal('info', message, fields);
}

export function warn(message: string, fields?: SerializableLogFields): void {
  return logInternal('warn', message, fields);
}

export function error(message: string, fields?: SerializableLogFields): void {
  return logInternal('error', message, fields);
}

export function log(
  log_level: LogLevel,
  message: string,
  fields?: SerializableLogFields,
): void {
  return logInternal(log_level, message, fields);
}

/**
 * Initialize Capture and automatically register global JS error handlers so exceptions and
 * unhandled promise rejections are reported without manual logging across the app.
 *
 * Call this once during app startup, before rendering your root component.
 */
export function initWithAutoCapture(
  key: string,
  sessionStrategy: SessionStrategy,
  options?: InitOptions,
): void {
  init(key, sessionStrategy, options);

  const gAny: any = global as any;
  const previousHandler = gAny.ErrorUtils?.getGlobalHandler?.();

  gAny.ErrorUtils?.setGlobalHandler?.((err: unknown, isFatal?: boolean) => {
    const e = err as { message?: string; stack?: string } | string;
    const message = typeof e === 'string' ? e : e?.message ?? 'Unhandled JS error';
    const stack = typeof e === 'object' && e && 'stack' in e ? (e as any).stack ?? '' : '';

    try {
      logInternal('error', message, {
        stack,
        isFatal: String(Boolean(isFatal)),
        where: 'rn:ErrorUtils',
      });
    } catch {
      // To handle?
    }

    if (previousHandler) {
      try {
        previousHandler(err as any, isFatal);
      } catch {
        // To handle?
      }
    }
  });

  // unhandled promise rejections when available
  try {
    const anyGlobal: any = globalThis as any;
    if (typeof anyGlobal.addEventListener === 'function') {
      anyGlobal.addEventListener('unhandledrejection', (evt: any) => {
        const r = evt?.reason as { message?: string; stack?: string } | string;
        const reason = typeof r === 'string' ? r : r?.message ?? String(r);
        const stack = typeof r === 'object' && r && 'stack' in r ? (r as any).stack ?? '' : '';

        try {
          logInternal('error', 'Unhandled promise rejection', {
            reason,
            stack,
            where: 'rn:unhandledrejection',
          });
        } catch {}
      });
    }
  } catch {}
}

/**
 * Adds a field to be included in all future log messages.
 *
 * Calling this multiple times for the same key will overwrite the previous value.
 *
 * @param key The key of the field to add.
 * @param value The value of the field to add.
 */
export function addField(key: string, value: Serializable): void {
  return NativeBdReactNative.addField(key, serialize(value));
}

/**
 * Removes a field that was previously added with {@link addField}.
 *
 * Calling this if the field has not been added will have no effect.
 *
 * @param key The key of the field to remove.
 */
export function removeField(key: string): void {
  return NativeBdReactNative.removeField(key);
}

export async function getDeviceID(): Promise<string> {
  return NativeBdReactNative.getDeviceID();
}

export async function getSessionID(): Promise<string> {
  return NativeBdReactNative.getSessionID();
}

export async function getSessionURL(): Promise<string> {
  return NativeBdReactNative.getSessionURL();
}

/**
 * Logs a screen view event. This can be called to record that a screen was viewed.
 * @param screenName The name of the screen that was viewed.
 */
export function logScreenView(screenName: string): void {
  return NativeBdReactNative.logScreenView(screenName);
}

/**
 * Writes an app launch TTI log event. This event should be logged only once per Logger configuration.
 * Consecutive calls have no effect.
 *
 * @param {number} tti_ms - The time between a user's intent to launch the app and when the app becomes
 *                       interactive. Calls with a negative duration are ignored.
 */
export function logAppLaunchTTI(tti_ms: number): void {
  return NativeBdReactNative.logAppLaunchTTI(tti_ms);
}

/**
 * Generate a device code for the current device. Useful for streaming logs from a specific device using {@link https://docs.bitdrift.dev/cli/quickstart.html#log-tailing|bd tail}.
 * @returns The device code for the current device.
 */
export async function generateDeviceCode(): Promise<string> {
  try {
    const deviceId = await getDeviceID();
    const body = JSON.stringify({ device_id: deviceId });

    return fetch(`${api_url}:443/v1/device/code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bitdrift-api-key': api_key,
      },
      body,
    })
      .then((res) => res.json())
      .then((data) => data.code)
      .catch((err) => err.message ?? 'Error generating device code');
  } catch {
    return 'Error generating device code';
  }
}
