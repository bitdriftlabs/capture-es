import { type BitdriftChannels } from './constants';
/**
 * Builds a channel name for the main process to listen to.
 * @param tail the tail of the channel name
 * @param prefix an optional prefix for the channel name
 * @returns
 */
export const buildChannelName = (tail: BitdriftChannels, prefix?: string) =>
  [prefix, 'bitdrift', tail.value].filter(Boolean).join(':');
