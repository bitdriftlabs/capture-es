# @bitdrift/electron

## Overview

This is the package containing the Electron support for bitdrift. See https://docs.bitdrift.io for more information.

## Installation

```bash
npm install @bitdrift/electron
```

## Usage

```javascript
import {
  init,
  info,
  SessionStrategy,
  getSessionID,
  generateDeviceID,
} from '@bitdrift/electron';

// Initialize the bitdrift SDK. This is expected to be called from the main process.
init('<api-key>', SessionStrategy.Activity);

// Send a custom log message at info level. Other log levels are trace, debug, warn, and error.
// This is expected to be called from the main process.
info('Hello, world!');

// Get the current session ID. See https://docs.bitdrift.io/sdk/features#session-management for more information about session management.
const sessionID = getSessionID();

// Generate a new device ID that can be used with the `devicecode` operator in bd tail. See https://docs.bitdrift.io/cli/quickstart.html#log-tailing for more information.
const deviceID = generateDeviceID();
```

## Quick Start

During initialization, additional options may be passed to allow for automatic registration of an electron main channel:

```javascript
// Initialize auto registration of channel listeners with default settings.
init('<api-key>', SessionStrategy.Activity, {
  autoAddMainListener: true,
});

// Initialize auto registration of channel listeners with custom settings.
init('<api-key>', SessionStrategy.Activity, {
  autoAddMainListener: {
    channelPrefix: 'my-channel',
  },
});
```

These options will register main channel listeners for `bitdrift:log`, or if a custom channel prefix is provided, `<channelPrefix>:bitdrift:log`.

To expose the bitdrift SDK to the renderer process, the `initRenderer` function can be called from the renderer process:

```javascript
import { initRenderer } from '@bitdrift/electron/renderer';

// Initialize with defaults.
initRenderer({
  autoExposeInMainWorld: true,
});

// Initialize with custom settings.
initRenderer({
  autoExposeInMainWorld: {
    exposeAs: 'logger',
    channelPrefix: 'my-channel',
  },
});
```

This will expose the bitdrift SDK to the renderer process as `window.bitdriftSDK`, or if a custom exposeAs value is provided, `window.<exposeAs>`.

NOTE: The channel prefix must match the prefix used in the main process for the main channel listeners to work correctly.
