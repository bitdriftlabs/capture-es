import { LOG_LEVEL_MAP } from './logAt';
import Native from './NativeBdReactNative';
import { startSpan, endSpan } from './span';

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

  test('calls Native.log with the correct fields', () => {
    const fields = { key: 'value' };

    const span = startSpan('message', 'error', fields);
    expect(Native.log).toHaveBeenCalledWith(4, '', {
      key: 'value',
      _span_id: expect.any(String),
      _span_name: 'message',
      _span_type: 'start',
    });

    endSpan(span, 'success');
    expect(Native.log).toHaveBeenCalledWith(LOG_LEVEL_MAP[span.level], '', {
      key: 'value',
      _span_id: span.id,
      _span_name: span.name,
      _span_type: 'end',
      _span_result: 'success',
      _duration_ms: expect.any(String),
    });
  });
});
