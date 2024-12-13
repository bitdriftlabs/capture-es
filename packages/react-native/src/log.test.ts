import { log } from './log';
import Native from './NativeBdReactNative';

jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: jest.fn().mockReturnValue({
      log: jest.fn(),
    }),
  },
}));

describe('log', () => {
  beforeEach(() => {
    (Native.log as jest.Mock) = jest.fn();
  });

  test.each`
    fields                                                  | expected
    ${{ key: 'value' }}                                     | ${{ key: 'value' }}
    ${{ key: 1 }}                                           | ${{ key: '1' }}
    ${{ key: 1.4329587 }}                                   | ${{ key: '1.4329587' }}
    ${{ key: true }}                                        | ${{ key: 'true' }}
    ${{ key: {} }}                                          | ${{ key: '{}' }}
    ${{ key: [] }}                                          | ${{ key: '[]' }}
    ${{ key: null }}                                        | ${{ key: 'null' }}
    ${{ key: undefined }}                                   | ${{ key: 'undefined' }}
    ${{ key: { nested: { nested: { nested: 'value' } } } }} | ${{ key: '{"nested":{"nested":{"nested":"value"}}}' }}
    ${{ key: [1, true, 'foobar'] }}                         | ${{ key: '[1,true,\"foobar\"]' }}
  `('calls Native.log with the correct fields', ({ fields, expected }) => {
    log(0, 'message', fields);

    expect(Native.log).toHaveBeenCalledWith(0, 'message', expected);
  });
});
