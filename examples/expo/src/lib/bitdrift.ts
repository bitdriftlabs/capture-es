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

const BITDRIFT_API_KEY = process.env.EXPO_PUBLIC_BITDRIFT_API_KEY;
const BITDRIFT_API_URL = process.env.EXPO_PUBLIC_BITDRIFT_API_URL;

if (BITDRIFT_API_KEY && BITDRIFT_API_URL) {
  init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
    url: BITDRIFT_API_URL,
    enableNetworkInstrumentation: true,
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
}
