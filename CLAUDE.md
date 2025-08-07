# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

frost2x is a browser extension that implements FROST (Flexible Round-Optimized Schnorr Threshold) signatures for Nostr and Bitcoin. It's a TypeScript fork of nos2x that enables distributed signing where multiple parties collaborate without revealing individual private keys.

## Key Commands

### Development
- `npm run build` - Build the extension (outputs to `/dist`)
- `npm run package` - Create distributable extension package (.zip and .crx in `/build`)
- `npm run start dev` - Run both test node and relay for development
- `npm run start node` - Run only the test signing node
- `npm run start relay` - Run only the test relay (port 8002)
- `npm run keygen [nsec]` - Generate FROST key shares for testing

### Testing Setup
Before testing the extension:
1. Create `test/config.json` from `config.example.json` with group credentials and shares
2. Run `npm run start dev` to start test node and relay
3. Build extension with `npm run build`
4. Load unpacked extension from `/dist` folder in Chrome

## Architecture

### Extension Structure
The extension uses Chrome Manifest V3 with multiple entry points:
- `background.ts` - Service worker handling all signing operations and node coordination
- `content-script.ts` - Injects providers into web pages
- `popup.tsx` - Quick access interface (React)
- `options.tsx` - Settings and configuration page (React)
- `prompt.tsx` - Permission request dialogs (React)

### Core Libraries (`/src/lib/`)
- `crypto.ts`, `cipher.ts` - Cryptographic utilities for encryption/decryption
- `wallet.ts` - Bitcoin wallet operations and PSBT signing
- `perms.ts` - Permission policy management
- `browser.ts` - Cross-browser extension API wrapper

### Data Stores (`/src/stores/`)
All stores use browser.storage.local with Zod validation:
- `node.ts` - Bifrost node configuration and state
- `settings.ts` - User preferences
- `perms.ts` - Domain permission policies
- `logs.ts` - Activity logging

### Message Handlers (`/src/handlers/`)
Process incoming messages from content scripts:
- `signer.ts` - Nostr NIP-07 operations (getPublicKey, signEvent, encrypt/decrypt)
- `wallet.ts` - Bitcoin operations (getAccount, getBalance, signPsbt)
- `node.ts` - Node management (connect, disconnect, status)

### Type System
- Strict TypeScript with `noEmit: true` (esbuild handles compilation)
- Zod schemas in `src/schema.ts` for runtime validation
- Message types defined in `src/const.ts`
- Path alias `@/*` maps to `src/*`

## Protocol Support

### Nostr (NIP-07)
- `window.nostr.getPublicKey()` - Returns FROST public key
- `window.nostr.signEvent(event)` - Signs using threshold signatures
- `window.nostr.encrypt/decrypt()` - NIP-04 encryption

### Bitcoin
- `window.bitcoin.getAccount()` - Get wallet account info
- `window.bitcoin.getBalance()` - Check balance
- `window.bitcoin.signPsbt()` - Sign Bitcoin transactions

## FROST Integration

The extension coordinates with other Bifrost nodes via WebSocket relays to perform threshold signing:
1. Receives signing request from web page
2. Creates signing session with other nodes
3. Performs distributed key generation rounds
4. Aggregates partial signatures
5. Returns complete signature to requesting page

Group credentials and individual shares are configured in the extension options. The Bifrost library (`@frostr/bifrost`) handles the cryptographic protocol implementation.

## Development Notes

- After building, refresh the extension in Chrome to load changes
- Test relay runs on `ws://localhost:8002` by default
- Use `npm run keygen` to generate test shares for development
- Permission prompts appear for new domains/operations
- Activity logs accessible in extension popup
- Node status shows peer connections and signing sessions