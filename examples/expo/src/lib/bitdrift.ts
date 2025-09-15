import {
  init,
  addField,
  removeField,
  debug,
  SessionStrategy,
  getSessionID,
  getSessionURL,
  getDeviceID,
} from '@bitdrift/react-native';
import * as Sentry from '@sentry/react-native';

const BITDRIFT_API_KEY = process.env.EXPO_PUBLIC_BITDRIFT_API_KEY;
const BITDRIFT_API_URL = process.env.EXPO_PUBLIC_BITDRIFT_API_URL;
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN && SENTRY_DSN.trim() !== '') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'development',
    enableAutoSessionTracking: true,
    enableAutoPerformanceTracing: true,
    tracesSampleRate: 1.0,
  });
  console.log('Sentry initialized');
} else {
  console.log('Sentry not configured - DSN missing or empty');
}

if (BITDRIFT_API_KEY && BITDRIFT_API_URL) {
  init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
    url: BITDRIFT_API_URL,
    enableNetworkInstrumentation: true,
    crashReporting: {
      enableNativeFatalIssues: true,
    },
  });

  getSessionID().then((sessionID) => {
    console.log('Session ID:', sessionID);
  });

  getSessionURL().then((sessionURL) => {
    console.log('Session URL:', sessionURL);
  });

  getDeviceID().then((deviceID) => {
    console.log('Device ID:', deviceID);
  });

  addField('environment', 'expo');
  removeField('environment');
  addField('environment', 'expo');
  debug('expo example initialized');
} else {
  console.log('Bitdrift API key or URL not found, skipping initialization');
}
