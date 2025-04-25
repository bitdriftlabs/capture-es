import Native from './NativeBdReactNative';
import { startSpan } from './span';

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

describe('spans', () => {
  beforeEach(() => {
    (Native.log as jest.Mock) = jest.fn();
  });

  describe('calls Native.log with the correct fields', () => {
    test('with fields', () => {
      const fields = { key: 'value' };

      const span = startSpan('message', 'error', fields);

      span.end('success');
      expect(Native.log).toHaveBeenNthCalledWith(1, 4, '', {
        key: 'value',
        _span_id: expect.any(String),
        _span_name: 'message',
        _span_type: 'start',
      });

      expect(Native.log).toHaveBeenNthCalledWith(2, 4, '', {
        key: 'value',
        _span_id: span.id,
        _span_name: 'message',
        _span_type: 'end',
        _span_result: 'success',
        _duration_ms: '0',
      });
    });

    test('with start time override and no end time override', () => {
      const fields = { key: 'value' };
      const startTimeInterval = 100;

      const span = startSpan('message', 'error', fields, startTimeInterval);

      span.end('success');
      expect(Native.log).toHaveBeenNthCalledWith(1, 4, '', {
        key: 'value',
        _span_id: span.id,
        _span_name: 'message',
        _span_type: 'start',
      });

      // Duration still uses performance.now()
      expect(Native.log).toHaveBeenNthCalledWith(2, 4, '', {
        key: 'value',
        _span_id: span.id,
        _span_name: 'message',
        _span_type: 'end',
        _span_result: 'success',
        _duration_ms: '0',
      });
    });

    test('with start time override and end time override', () => {
      const fields = { key: 'value' };
      const startTimeInterval = 100;

      const span = startSpan('message', 'error', fields, startTimeInterval);

      span.end('success', 200);
      expect(Native.log).toHaveBeenNthCalledWith(1, 4, '', {
        key: 'value',
        _span_id: expect.any(String),
        _span_name: 'message',
        _span_type: 'start',
      });

      expect(Native.log).toHaveBeenNthCalledWith(2, 4, '', {
        key: 'value',
        _span_id: span.id,
        _span_name: 'message',
        _span_type: 'end',
        _span_result: 'success',
        _duration_ms: '100',
      });
    });
  });
});
