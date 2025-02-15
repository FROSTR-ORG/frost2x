# frost2x

Notes and other stuff signed by an extension, using the powers of FROST.

* Fork of the popular [nos2x](https://github.com/fiatjaf/nos2x) extension.
* Uses the [Bifrost](https://github.com/frostr-org/bifrost) library for encryption and signing of events.
* Allows FROST-based signing for any website that supports NIP-07.
* Updated codebase to use typescript and run-time type checking.

## Overview

This project is a fork of the popular nos2x extension. It uses the [Bifrost](https://github.com/frostr-org/bifrost) library in the background to encrypt and sign events. The bifrost node will communicate with other nodes in the network to coordinate signing.

This extension is intended to be used in conjunction with the [Igloo](https://github.com/frostr-org/igloo) desktop app for key generation and sharing, however you can also run a local relay and Bifrost node for development and testing.

The standard NIP-07 signing interface remains unchanged.

## Installation

This extension is not yet available in the Chrome Web Store, so you will need to install it manually.

1. Download the `extension/` folder of this repository.
2. Go to `chrome://extensions`.
3. Enable "Developer mode" if it is not already enabled.
4. Click on "Load unpacked" and select the `extension/` folder of this repository.

In the options menu for the extension, you can configure the credentials for the signing group, and the share that you want to use.

For now, you also have to specify the public key of the peer you wish to communicate with for signing. Peer discovery will be improved in the future.

To generate a set of credentials for a group, you can use the `keygen` script in the root of the repository:

```
npm run keygen <optional_secret_key>
```

This will generate a credentials package with a set of shares. You can copy/paste the group credentials and one of the shares into the `test/src/cred.json` file, and another share into the frost2x extension.

Feel free to modify the `test/src/keygen.ts` file to generate credentials for more members, or use a different threshold.

## Development

To build the plugin from source:

```
npm install
./build.js prod
```

You can also run a local relay and Bifrost node for development and testing:

```bash
# Run the test/scratch.ts script.
npm run scratch
```

This will start a local relay on port 8002 and a Bifrost node. The test Bifrost node will use the `test/src/cred.json` file to coordinate with the extension.

