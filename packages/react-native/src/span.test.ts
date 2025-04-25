jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn().mockReturnValue({
      log: jest.fn(),
    }),
  },
  Platform: {
    select: jest.fn().mockReturnValue(''),
  },

}));

import Native from './NativeBdReactNative';
import { startSpan, endSpan } from './span';

describe('spans', () => {
  beforeEach(() => {
    (Native.log as jest.Mock) = jest.fn();
  });

  test('calls Native.log with the correct fields', () => {
    const fields = { key: 'value' };

    const span = startSpan('message', 'error', fields);
    expect(Native.log).toHaveBeenCalledWith(0, 'message', fields);

    endSpan(span, 'success');
    expect(Native.log).toHaveBeenCalledWith(0, 'message', fields);
  });
});
