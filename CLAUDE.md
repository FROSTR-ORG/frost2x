# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

frost2x is a browser extension that implements FROST (Flexible Round-Optimized Schnorr Threshold) signatures for Nostr and Bitcoin. It's a TypeScript fork of nos2x that enables distributed signing where multiple parties collaborate without revealing individual private keys.

## Key Commands

### Build & Development
- `npm run build` - Build the extension (outputs to `/dist`)
- `npm run package` - Create distributable extension package (.zip and .crx in `/build`)
- `npx tsc --noEmit` - Type-check without building (use for finding TypeScript errors)

### Testing
- `npm run start` - Run both test node and relay for development (default)
- `npm run start:dev` - Run both test node and relay explicitly
- `npm run start:node` - Run only the test signing node
- `npm run start:relay` - Run only the test relay (port 8002)
- `npm run keygen [nsec]` - Generate FROST key shares for testing

*Note: You can also use `npm run start -- dev|node|relay` to pass parameters directly*

### Testing Setup
1. Create `test/config.json` from `config.example.json` with group credentials and shares
2. Run `npm run start` to start test node and relay (defaults to 'dev' mode)
3. Build extension with `npm run build`
4. Load unpacked extension from `/dist` folder in Chrome
5. After changes, rebuild and refresh the extension in `chrome://extensions`

## Architecture

### Extension Structure (Manifest V3)
The extension uses multiple entry points, all built with esbuild:
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
All stores use browser.storage.local with runtime validation via custom `create_store` factory:
- `node.ts` - Bifrost node configuration and state (group, shares, peers, relays)
- `settings.ts` - User preferences (nested structure: explorer, links, tx, node settings)
- `perms.ts` - Domain permission policies for signer and wallet operations
- `logs.ts` - Activity logging with expandable data payloads
- `extension.ts` - Composite store combining all stores for unified access

### Message Handlers (`/src/handlers/`)
Process incoming messages from content scripts:
- `signer.ts` - Nostr NIP-07 operations (getPublicKey, signEvent, encrypt/decrypt)
- `wallet.ts` - Bitcoin operations (getAccount, getBalance, signPsbt)
- `node.ts` - Node management (connect, disconnect, status, ping, echo)
- `link.ts` - Nostr link resolution

### Type System
- Strict TypeScript with `noEmit: true` (esbuild handles compilation)
- Zod schemas in `src/schema.ts` for runtime validation
- Message types defined in `src/const.ts` with permission mappings
- Path alias `@/*` maps to `src/*`
- Store types use namespaces (e.g., `SettingStore.Type`)

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

### Important Bifrost Details
- Echo operations broadcast to ALL connected peers, not specific ones
- The node automatically sends a self-echo on successful share addition for handoff confirmation
- Peer status can be 'online', 'offline', or 'checking'
- Event logs capture data payloads for debugging (expandable in console)

### Known Issues & Workarounds
- **BifrostNode Constructor**: The library has inconsistent config validation. The init_node function in `src/services/node.ts` tries multiple config approaches sequentially until one succeeds (no config → empty object → policies only → full config)

## Security & Logging

### Critical: Sensitive Data Redaction

**NEVER log the following sensitive cryptographic material, even in development:**
- Private keys (nsec, xprv, WIF)
- FROST key shares (seckey, binder_sn, hidden_sn)
- PSBT sensitive fields (signatures, witness data, private paths)
- Seed phrases and entropy
- Raw cryptographic material (private scalars, nonces)

### Redaction Guidelines

1. **Use structured logging with allowlists** - Only log explicitly safe fields:
   ```typescript
   // DON'T log the entire object
   console.log('node:', node)  // ❌ May leak shares
   
   // DO log specific safe fields
   console.log('node status:', {
     peerCount: node.peers.length,
     relayUrls: node.relays,
     isReady: node.is_ready
   })  // ✅ Only safe data
   ```

2. **Redact sensitive values** - Replace with placeholders:
   ```typescript
   // Example redaction for shares
   const safeShare = {
     idx: share.idx,
     seckey: '[REDACTED]',
     binder_sn: share.binder_sn ? '[REDACTED]' : undefined,
     pubkey: share.pubkey  // Public keys are safe
   }
   ```

3. **Use the safeSerialize helper** (in `src/services/node.ts`):
   ```typescript
   const eventData = safeSerialize(data.length > 0 ? data : undefined)
   LogStore.add(`${event}`, 'info', eventData)
   ```

4. **Mask partial bytes** for debugging without exposing full values:
   ```typescript
   function maskSecret(secret: string): string {
     if (!secret) return '[EMPTY]'
     return secret.slice(0, 6) + '...' + secret.slice(-4)
     // Shows: 'a1b2c3...89ef' instead of full secret
   }
   ```

### Safe Logging Patterns

- **Group/Peer Info**: Log pubkeys, indices, peer counts, online status
- **Transaction Info**: Log txids, amounts, addresses (but not signatures/witnesses)
- **Node State**: Log connection status, relay URLs, policy settings
- **Error Messages**: Ensure stack traces don't contain sensitive data

Always audit logs before release to ensure no sensitive data leakage.

## Common Development Patterns

### Store Access
- Settings use nested objects (e.g., `settings.explorer.network`), not flat keys
- Stores provide fetch, update, reset, subscribe, and middleware support
- Concurrent fetching with fallbacks to defaults

### Error Handling
All async handlers should validate input parameters before processing and return consistent error structures with `result` and `error` fields.

### Component Structure
- React components in `/src/components/` use hooks for state management
- Custom hooks in `/src/hooks/` handle browser runtime messaging
- Settings components manage local state before persisting to stores

## Development Notes

- After building, refresh the extension in Chrome to load changes
- Test relay runs on `ws://localhost:8002` by default
- Use `npm run keygen` to generate test shares for development
- Permission prompts appear for new domains/operations
- Console logs are expandable in Options > Console tab to view event data
- Build output goes to `/dist` only
- All builds use esbuild with sourcemaps in development mode