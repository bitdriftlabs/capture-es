import { init, debug } from '@bitdrift/react-native';
import { SessionStrategy } from 'packages/react-native/src/NativeBdReactNative';

const BITDRIFT_API_KEY = process.env.EXPO_PUBLIC_BITDRIFT_API_KEY;
const BITDRIFT_API_URL = process.env.EXPO_PUBLIC_BITDRIFT_API_URL;

if (BITDRIFT_API_KEY && BITDRIFT_API_URL) {
  init(BITDRIFT_API_KEY, SessionStrategy.Activity, {
    url: BITDRIFT_API_URL,
    enableNetworkInstrumentation: true,
  });
  debug('expo example initialized');
}
