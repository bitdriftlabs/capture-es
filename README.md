# capture-es

**capture-es:** bitdrift SDK integration

## Setup

To install dependencies, run

```sh
$ npm ci
```

## Electron

Builds the electron library in debug mode:

`nx build electron`

Build the electron library in release mode, suitable for distribution:

`nx build electron -c release`

Runs the test suite:

`nx test electron`

### Exploring Electron

After building capture-es, you can explore its exports at the Node REPL:

```sh
$ nx build electron
$ node
> require('./dist/native.node').init("<api key>")
```

## React Native

The React Native library needs to run in the context of an app, so use the `expo` example app
to build and develop the plugin. By opening the `expo` app in XCode or Android Studio, the
plugin files can be edited directly for a smoother development experience.

## Example Apps

To run either of the example apps, refer to the READMEs in `examples/`
