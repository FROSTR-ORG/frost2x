# frost2x

### notes and other stuff signed by an extension using FROST.

## Frostr Signer Extension

Use this to sign [Nostr](https://github.com/nostr-protocol/nostr) events on web-apps without having to store your private key in the browser or extension.

It implements [Bifrost](https://github.com/frostr-org/bifrost) in the background, which communicates with the [Igloo](https://github.com/frostr-org/igloo) desktop app to sign messages.

You can also use it to sign other stuff, not just Nostr events.

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

To run the plugin from this code:

```
git clone https://github.com/frostr-org/frost2x
cd frost2x
npm install
./build.js prod
```

then

1. go to `chrome://extensions`;
2. ensure "developer mode" is enabled on the top right;
3. click on "Load unpackaged";
4. select the `extension/` folder of this repository.

To run a development relay and Bifrost node:

```
npm run scratch
```

This will start a local relay on port 8002 and a Bifrost node listening on port 8003. The test Bifrost node will use the `test/src/cred.json` file to coordinate with the extension.

To generate a new set of credentials:

```
npm run keygen <optional_secret_key>
```

This will generate a credentials package with a set of shares. You can copy/paste the group credentials and one of the shares into the `test/src/cred.json` file, and another share into the frost2x extension (under the options menu).

Feel free to modify the `test/src/keygen.ts` file to generate credentials for more members, or use a different threshold.

---

LICENSE: public domain.
