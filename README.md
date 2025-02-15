# frost2x

Notes and other stuff signed by an extension, using the powers of FROST.

* Fork of the popular [nos2x](https://github.com/fiatjaf/nos2x) extension.
* Uses the [Bifrost](https://github.com/frostr-org/bifrost) library for encryption and signing of events.
* Allows FROST-based signing for any website that supports NIP-07.
* Updated codebase to use typescript and run-time type checking.

## Overview

This project is a fork of the popular nos2x extension. It uses the [Bifrost](https://github.com/frostr-org/bifrost) library in the background to encrypt and sign events.

This extension is intended to be used in conjunction with the [Igloo](https://github.com/frostr-org/igloo) desktop app for key generation and sharing.

The development section below describes how to run a local relay and Bifrost node for development and testing.

The standard NIP-07 signing interface remains unchanged.

## Development

To build the plugin from source:

```
npm install
./build.js prod
```

then

1. go to `chrome://extensions`;
2. ensure "developer mode" is enabled on the top right;
3. click on "Load unpackaged";
4. select the `extension/` folder of this repository.

You can also run a local relay and Bifrost node for development and testing:

```bash
# Run the test/scratch.ts script.
npm run scratch
```

This will start a local relay on port 8002 and a Bifrost node. The test Bifrost node will use the `test/src/cred.json` file to coordinate with the extension.

To generate a new set of credentials:

```
npm run keygen <optional_secret_key>
```

This will generate a credentials package with a set of shares. You can copy/paste the group credentials and one of the shares into the `test/src/cred.json` file, and another share into the frost2x extension (under the options menu).

Feel free to modify the `test/src/keygen.ts` file to generate credentials for more members, or use a different threshold.
