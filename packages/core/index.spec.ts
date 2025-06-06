// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import * as fs from 'fs';
import { Logger, SessionStrategy } from './index.js';

describe('bitdrift native logger', () => {
  let logger: Logger;

  const getLogger = () =>
    new Logger(
      'api-key',
      'https://api.bitdrift.dev',
      SessionStrategy.Fixed,
      './store',
      'io.bitdrift.chippy',
      '1.0',
      'testOS',
      '1.3.3.7',
      'en-US',
    );

  beforeEach(() => {
    logger = getLogger();
  });

  afterAll(() => {
    try {
      if (fs.existsSync('./store')) {
        fs.rmSync('./store', { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('Failed to clean up store directory:', error);
      // Continue test teardown even if cleanup fails
    }
  });

  it('logger should be set', () => {
    expect(logger).toBeDefined();
  });

  it('should create a sessionId as uuidv4', () => {
    expect(logger.sessionId).toHaveLength(36);
  });

  it('subsequent calls to sessionId should return the same ID', () => {
    const previousSessionId = logger.sessionId;
    expect(logger.sessionId).toHaveLength(36);
    expect(logger.sessionId).toEqual(previousSessionId);
  });

  it('should create a deviceId', () => {
    expect(logger.deviceId).toHaveLength(36);
  });

  it('new logger should return same device', () => {
    expect(logger.deviceId).toHaveLength(36);
    expect(logger.deviceId).toEqual(getLogger().deviceId);
  });

  it('new logger should return a new session', () => {
    const newSession = getLogger().sessionId;
    expect(logger.sessionId).toHaveLength(36);
    expect(newSession).toHaveLength(36);
    expect(logger.sessionId).not.toEqual(newSession);
  });

  it('Can add and remove fields', () => {
    getLogger().addField('test_str', 'Hello');
    getLogger().addField('test_int', 1);
    getLogger().addField('test_bool', true);
    getLogger().addField('test_buf', Buffer.from('Hello'));
    getLogger().removeField('test_buf');
    getLogger().removeField('non_existent');
  });
});
