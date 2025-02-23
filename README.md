# frost2x

Notes and other stuff signed by an extension, using the powers of FROST.

* Fork of the popular [nos2x](https://github.com/fiatjaf/nos2x) extension.
* Uses the [Bifrost](https://github.com/frostr-org/bifrost) library for encryption and signing of events.
* Allows FROST-based signing for any website that supports NIP-07.
* Updated codebase to use typescript and run-time type checking.

## Overview

This project is a fork of the popular nos2x extension. It uses the [Bifrost](https://github.com/frostr-org/bifrost) library in the background to encrypt and sign events. The bifrost node will communicate with other nodes in the network to coordinate signing.

This extension is intended to be used in conjunction with the [Igloo](https://github.com/frostr-org/igloo) desktop app for key generation and sharing, however you can also run a local signing node and relay for testing (see [development](#development)).

The standard NIP-07 signing interface remains unchanged.

## Installation

This extension is not yet available in the Chrome Web Store, so you will need to install it manually.

1. Go to `chrome://extensions`.
2. Enable "Developer mode" if it is not already enabled.
3. Click on "Load unpacked" and select the `extension/` folder of this repository.

In the options menu for the extension, you can input the credentials for your signing group, and the individual share that you want to use.

## Generating Shares

To generate a set of shares for your nsec, you can use the `keygen` script in the root of the repository:

```
npm run keygen <optional_secret_key_or_nsec>
```

This will generate a group credentials package with a set of shares, and print it to your console.

Copy/paste the group credential, plus one of the shares into the `frost2x` extension, via the options menu.

## Running the Test Node / Relay

This repository comes with a second signing node for testing, as well as a basic nostr relay.

To configure the test signing node:

* Create a `config.json` file in the `test` folder (path should be `test/config.json`).
* Copy/paste the group credential, plus one of the shares into the file (follow the example of `config.example.json`).
* Define a list of relays you wish to connect to (or keep the local test relay as default).

Once you have a credential file configured, you can run the node and/or relay using the following:

```bash
## Run the signing node:
npm run start node
## Run the test relay:
npm run start relay
## Run both the node and the relay:
num run start dev
```

Running in `dev` mode will spin up both a signing node and relay. By default, the relay will be listening on port `8002`.

## Development

To build the plugin from source, simply run the `build` script:

```
npm run build
```

This will build from `src`, and place the completed files into the `extension` folder. Make sure to "refresh" the frost2x extension after each build. You can do this from the extension page in your browser.

## Bugs / Issues / Suggestions

We are looking for feedback! If you find a bug or have a suggestion:

1. First, check if the issue already exists in our [issue tracker](https://github.com/frostr-org/frost2x/issues)

2. If not, create a new issue with:
   - A clear, descriptive title
   - Detailed steps to reproduce the problem
   - What you expected to happen vs what actually happened
   - Any relevant error messages or screenshots
   - Your browser version and operating system

This project is under heavy development, we'll try to get back to your issue asap.
