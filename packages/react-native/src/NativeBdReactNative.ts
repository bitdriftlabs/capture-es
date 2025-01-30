// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type LogFields = { [key: string]: string };
export enum SessionStrategy {
  Activity = 'activity',
  Fixed = 'fixed',
}

export type InitOptions<T extends SessionStrategy> = {
  url?: string;
  enableNetworkInstrumentation?: boolean;
} & (T extends SessionStrategy.Fixed
  ? { sessionIDGenerator: () => string }
  : {});

export interface Spec extends TurboModule {
  init<T extends SessionStrategy>(
    key: string,
    sessionStrategy: T,
    options?: InitOptions<T>,
  ): void;

  log(level: number, message: string, fields?: LogFields): void;

  addField(key: string, value: string): void;

  removeField(key: string): void;

  getDeviceID(): Promise<string>;

  getSessionID(): Promise<string>;

  getSessionURL(): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BdReactNative');
