import {
  DeviceEventEmitter,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import { installGlobalErrorHandler } from './globalErrorHandler';
import {
  logInternal,
  serialize,
  type SerializableLogFields,
  Serializable,
  LogLevel,
} from './log';
import {
  InitOptions as NativeInitOptions,
  CrashReportingOptions as NativeCrashReportingOptions,
  SessionStrategy,
} from './NativeBdReactNative';
import NativeBdReactNative from './NativeBdReactNative';
export { SessionStrategy } from './NativeBdReactNative';

const ISSUE_REPORT_EVENT = 'BdReactNative.onBeforeReportSend';

export type IssueReport = {
  reportType: string;
  reason: string;
  details: string;
  sessionId: string;
  fields: Record<string, string>;
};

export type CrashReportingOptions = NativeCrashReportingOptions & {
  onBeforeReportSend?: (report: IssueReport) => void;
  onBeforeReportSendExecutor?: (task: () => void) => void;
};

export type InitOptions = Omit<NativeInitOptions, 'crashReporting'> & {
  crashReporting?: CrashReportingOptions;
};

let api_url: string;
let api_key: string;
let onBeforeReportSendListener: { remove: () => void } | undefined;

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

const issueReportEmitter =
  Platform.OS === 'ios'
    ? new NativeEventEmitter(BdReactNativeModule)
    : DeviceEventEmitter;

export function init(
  key: string,
  sessionStrategy: SessionStrategy,
  options?: InitOptions,
): void {
  console.log('CRASH_HOOK_VERIFICATION JS init', {
    hasCrashReporting: Boolean(options?.crashReporting),
    hasOnBeforeReportSend: Boolean(options?.crashReporting?.onBeforeReportSend),
    hasOnBeforeReportSendExecutor: Boolean(options?.crashReporting?.onBeforeReportSendExecutor),
  });

  api_url = options?.url ?? 'api.bitdrift.io';
  api_key = key;
  // Install JS global error handler if enabled via config
  if (options?.crashReporting?.UNSTABLE_enableJsErrors === true) {
    installGlobalErrorHandler();
  }

  onBeforeReportSendListener?.remove();
  onBeforeReportSendListener = undefined;
  console.log('CRASH_HOOK_VERIFICATION JS previous listener removed');

  if (options?.crashReporting?.onBeforeReportSend) {
    const callback = options.crashReporting.onBeforeReportSend;
    const executor = options.crashReporting.onBeforeReportSendExecutor;

    onBeforeReportSendListener = issueReportEmitter.addListener(
      // iOS requires NativeEventEmitter to trigger startObserving in the native module.
      ISSUE_REPORT_EVENT,
      (report: IssueReport) => {
        console.log('CRASH_HOOK_VERIFICATION JS event received', report);
        if (executor) {
          console.log('CRASH_HOOK_VERIFICATION JS executing callback via custom executor');
          executor(() => callback(report));
          return;
        }
        console.log('CRASH_HOOK_VERIFICATION JS executing callback directly');
        callback(report);
      },
    );
    console.log('CRASH_HOOK_VERIFICATION JS listener registered', ISSUE_REPORT_EVENT);
  } else {
    console.log('CRASH_HOOK_VERIFICATION JS listener not registered (no callback provided)');
  }

  const nativeOptions: NativeInitOptions = {
    ...options,
    crashReporting: options?.crashReporting
      ? {
          enableNativeFatalIssues: options.crashReporting.enableNativeFatalIssues,
          UNSTABLE_enableJsErrors: options.crashReporting.UNSTABLE_enableJsErrors,
        }
      : undefined,
  };

  return BdReactNative.init(key, sessionStrategy, nativeOptions);
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

export function error(
  message: string,
  error?: Error | null,
  fields?: SerializableLogFields,
): void {
  const combinedFields = error ? {
    ...fields,
    _error: error.name || 'Error',
    ...(error.message && { _error_details: error.message }),
  } : fields;
  
  return logInternal('error', message, combinedFields);
}

export function log(
  log_level: LogLevel,
  message: string,
  fields?: SerializableLogFields,
): void {
  return logInternal(log_level, message, fields);
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
 * Records a feature flag exposure with a variant. Use this method to track when
 * a user is exposed to a specific feature flag variant in your application. The exposure
 * is recorded with a timestamp and tracked for the duration of the process.
 *
 * @param name the name of the flag being exposed
 * @param variant the variant of the flag being exposed
 */
export function setFeatureFlagExposure(name: string, variant: string | boolean): void {
  if (typeof variant === 'boolean') {
    return NativeBdReactNative.setFeatureFlagExposureBool(name, variant);
  } else {
    return NativeBdReactNative.setFeatureFlagExposureString(name, variant);
  }
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
