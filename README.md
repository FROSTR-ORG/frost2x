# frost2x

Notes and other stuff signed by an extension, using the powers of FROST.

## Features

* Fork of the popular [nos2x](https://github.com/nos2x) extension.
* Uses the [Bifrost](https://github.com/frostr-org/bifrost) library for coordianted signing.
* Uses the [Igloo](https://github.com/frostr-org/igloo) desktop app for key generation and sharing.
* Updated codebase to use typescript and run-time type checking.

Use this to sign [Nostr](https://github.com/nostr-protocol/nostr) events on web-apps without having to store your private key in the browser or extension.

It implements [Bifrost](https://github.com/frostr-org/bifrost) in the background, which communicates with the [Igloo](https://github.com/frostr-org/igloo) desktop app to sign messages.

The standard NIP-07 signing interface remains unchanged:

```
async window.nostr.getPublicKey(): string // returns your public key as hex
async window.nostr.signEvent(event): Event // returns the full event object signed
async window.nostr.getRelays(): { [url: string]: RelayPolicy } // returns a map of relays
async window.nostr.nip04.encrypt(pubkey, plaintext): string // returns ciphertext+iv as specified in nip04
async window.nostr.nip04.decrypt(pubkey, ciphertext): string // takes ciphertext+iv as specified in nip04
async window.nostr.nip44.encrypt(pubkey, plaintext): string // takes pubkey, plaintext, returns ciphertext as specified in nip-44
async window.nostr.nip44.decrypt(pubkey, ciphertext): string // takes pubkey, ciphertext, returns plaintext as specified in nip-44
```

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

---

LICENSE: public domain.
