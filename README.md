# frost2x

Notes and other stuff signed by an extension, using the powers of FROST.

> Now available in the [chrome web store](https://chromewebstore.google.com/detail/frost2x/gpbndcgoaehgeckcfmmbmaaaeljnaiof)!

* Fork of the popular [nos2x](https://github.com/fiatjaf/nos2x) extension.
* Uses the [Bifrost](https://github.com/frostr-org/bifrost) library for encryption and signing of events.
* Allows FROST-based signing for any website that supports NIP-07.
* Updated codebase to use typescript and run-time type checking.

## Overview

This project is a fork of the popular nos2x extension. It uses a [Bifrost](https://github.com/frostr-org/bifrost) node in the background to encrypt and sign events. This node will communicate with other bifrost nodes in the network, to coordinate signing plus aggregation of signatures.

This extension is intended to be used in conjunction with the [Igloo](https://github.com/frostr-org/igloo) desktop app for key generation and sharing, however you can also run a local signing node and relay for testing (see [running a test node](#running-the-test-node--relay)).

The standard NIP-07 signing interface remains unchanged.

## Installation

This extension available in the [Chrome Web Store](https://chromewebstore.google.com/detail/frost2x/gpbndcgoaehgeckcfmmbmaaaeljnaiof),but you can also build and install it manually as an unpacked extension:

1. Go to `chrome://extensions`.
2. Enable "Developer mode" if it is not already enabled.
3. Click on "Load unpacked" and select the `extension/` folder of this repository.

In the options menu for the extension, you can input the credentials for your signing group, and the individual share that you want to use.

## Generating Shares

To generate a set of shares for your nsec, you can use the `keygen` script:

```
npm run keygen <optional_secret_key_or_nsec>
```

This will generate a group credentials package with a set of shares, and print it to your console.

Copy/paste the group credential, plus one of the shares into the `frost2x` extension, via the options menu.

> The script is located at `test/scripts/keygen.ts`, feel free to modify it.

## Running a Test Node / Relay

This repo comes with a second bifrost node for demonstration and testing, plus a basic nostr relay for ephemeral messaging.

To configure the test node:

* Create a `config.json` file in the `test` folder (path should be `test/config.json`).
* Copy/paste the group credential, plus one of the shares into the file (follow the example of `config.example.json`).
* Define a list of relays you wish to connect to (or keep the local test relay as default).

Once you have a config file set, you can run the node and/or relay:

```bash
## Run the signing node:
npm run start node
## Run the test relay:
npm run start relay
## Run both the node and the relay:
npm run start dev
```

By default, the relay will be listening on port `8002`. You can change this by modifying the start script in `test/scripts/start.ts`.

## Development

To build the plugin from source, simply run the `build` script:

```
npm run build
```

This will build from the `src` folder, then place the completed files into the `extension` folder. Make sure to "refresh" the frost2x extension after each build. You can do this from the extension page in your browser.

## Issues / Suggestions

We are looking for feedback! If you find a bug or have a suggestion:

1. First, check if the issue already exists in our [issue tracker](https://github.com/frostr-org/frost2x/issues)

2. If not, create a new issue with:
   - A clear, descriptive title
   - Detailed steps to reproduce the problem
   - What you expected to happen vs what actually happened
   - Any relevant error messages or screenshots
   - Your browser version and operating system

This project is under heavy development, we'll try to get back to your issue asap.
