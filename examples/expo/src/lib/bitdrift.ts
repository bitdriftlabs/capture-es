import { init, debug } from '@bitdrift/react-native';

const BITDRIFT_API_KEY = process.env.EXPO_PUBLIC_BITDRIFT_API_KEY;
const BITDRIFT_API_URL = process.env.EXPO_PUBLIC_BITDRIFT_API_URL;

if (BITDRIFT_API_KEY && BITDRIFT_API_URL) {
  init(BITDRIFT_API_KEY, { url: BITDRIFT_API_URL });
  debug('expo example initialized');
}
