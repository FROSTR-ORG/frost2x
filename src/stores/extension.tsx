// src/stores/extensionStore.tsx
import { createStore } from './factory.js'

import type { ExtensionStore } from '../types/index.js'

const DEFAULT_EXTENSION_STORE: ExtensionStore = {
  init: false,
  node: {
    group: null,
    peers: null,
    relays: [],
    share: null,
  },
  permissions: {
    address : [],
    signer  : [],
    wallet  : [],
  },
  settings: {
    'explorer/api_url'      : 'https://mempool.space/api',
    'explorer/link_url'     : 'https://mempool.space',
    'explorer/network'      : 'mainnet',
    'explorer/rate_limit'   : 5000,
    'general/notifications' : false,
    'links/is_active'       : false,
    'links/resolver_url'    : 'https://njump.me/{raw}',
    'tx/default_priority'   : 'medium',
    'tx/max_fee_rate'       : 1000,
    'tx/max_spend_amount'   : 1000000,
  },
  wallet: {
    address  : null,
    utxo_set : [],
  },
}

export const {
  StoreProvider : ExtensionStoreProvider,
  useStore      : useExtensionStore,
  fetchStore    : fetchExtensionStore,
  onStoreUpdate : onExtensionStoreUpdate,
  updateStore   : updateExtensionStore,
} = createStore<ExtensionStore>('extensionStore', DEFAULT_EXTENSION_STORE)
