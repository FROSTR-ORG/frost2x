import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { ReactNode }                from 'react'
import type { ExtensionStore, StoreAPI } from '../types/index.js'

import browser from 'webextension-polyfill'

const DEBUG = true

const DEFAULT_STORE: ExtensionStore = {
  init: false,
  node: {
    group   : null,
    peers   : null,
    relays  : [],
    share   : null,
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
  wallet : {
    address    : null,
    chain_info : null,
    chain_txs  : [],
    pool_txs   : [],
    utxo_set   : [],
  }
}

export const StoreContext = createContext<StoreAPI<ExtensionStore> | null>(null)

export function StoreProvider (
  { children }: { children: ReactNode }
) : ReactNode {
  const [store, setStore]   = useState<ExtensionStore>(DEFAULT_STORE)
  const [isInit, setIsInit] = useState(false)

  // Initialize store once
  useEffect(() => {
    if (!isInit) {
      let init_store: ExtensionStore = DEFAULT_STORE,
          sync_store: Partial<ExtensionStore> = {}
      
      browser.storage.sync.get('store').then(results => {
        sync_store = results.store ?? {}
        init_store = merge_stores(init_store, sync_store)
        setStore(init_store)
        setIsInit(true)
        if (is_keys_changed(DEFAULT_STORE, sync_store)) {
          browser.storage.sync.set({ store: init_store })
        }
        if (DEBUG) console.log('init store:', init_store)
      })
    }
  }, [isInit])

  // Listen for storage changes
  useEffect(() => {
    const listener = (changes: any) => {
      const store_changes = changes.store?.newValue;
      if (store_changes !== undefined) {
        const new_store = merge_stores(store, store_changes)
        if (is_store_changed(store, new_store)) {
          setStore(new_store)
          if (DEBUG) {
            console.log('store changes:', store_changes);
            console.log('store changed:', new_store);
          }
        }
      }
    }
    
    browser.storage.sync.onChanged.addListener(listener);
    return () => browser.storage.sync.onChanged.removeListener(listener);
  }, [ store ])

  const update = (data: Partial<ExtensionStore>) => {
    // If the store has changed, update the storage.
    const new_store = merge_stores(store, data)
    if (is_store_changed(store, new_store)) {
      browser.storage.sync.set({ store: new_store }).then(() => {
        if (DEBUG) {
          console.log('store changes:', data)
          console.log('updated store:', new_store)
        }
      })
    }
    // Update the store cache.
    setStore(new_store)
  }

  const set   = (data: ExtensionStore) => update(data)
  const reset = () => set(DEFAULT_STORE)

  return (
    <StoreContext.Provider value={{ store, set, update, reset }}>
      { children }
    </StoreContext.Provider>
  )
}

// Custom hook to use the store
export function useStore() {
  const context = useContext(StoreContext)
  if (context === null) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

// Helper functions
function is_keys_changed(
  curr: Partial<ExtensionStore>,
  next: Partial<ExtensionStore>
) {
  const curr_keys = Object.keys(curr).sort();
  const next_keys = Object.keys(next).sort();
  return JSON.stringify(curr_keys) !== JSON.stringify(next_keys);
}

function is_store_changed (
  curr: ExtensionStore,
  next: ExtensionStore
) {
  return JSON.stringify(curr) !== JSON.stringify(next);
}

function merge_stores (
  curr: ExtensionStore,
  next: Partial<ExtensionStore>
) {
  const merged_store = {
    ...curr, ...next,
    node     : { ...curr.node,     ...next.node },
    settings : { ...curr.settings, ...next.settings },
    wallet   : { ...curr.wallet,   ...next.wallet },
    init     : true
  }
  return merged_store
}
