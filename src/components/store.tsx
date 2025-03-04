import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { ReactNode }                from 'react'
import type { ExtensionStore, StoreAPI } from '../types.js'

import browser from 'webextension-polyfill'

const DEBUG = true

const DEFAULT_STORE: ExtensionStore = {
  group    : null,
  peers    : null,
  relays   : [],
  share    : null,
  settings : {
    'general/show_notifications': false,
    'links/is_active': false,
    'links/resolver_url': 'https://njump.me/{raw}'
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
        init_store = { ...init_store, ...sync_store }
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
      const new_store = changes.store?.newValue;
      if (
        new_store !== undefined &&
        is_store_changed(store, new_store) &&
        is_store_changed(DEFAULT_STORE, new_store)
      ) {
        setStore(new_store);
        if (DEBUG) console.log('store changed:', new_store);
      }
    };
    
    browser.storage.sync.onChanged.addListener(listener);
    return () => browser.storage.sync.onChanged.removeListener(listener);
  }, [store])

  const update = (data: Partial<ExtensionStore>) => {
    // Create a new store with the updated data.
    const new_store = { ...store, ...data }
    // If the store has changed, update the storage.
    if (is_store_changed(store, new_store)) {
      browser.storage.sync.set({ store: new_store }).then(() => {
        if (DEBUG) console.log('updated store:', new_store)
      })
    }
    // Update the store cache.
    setStore(new_store)
  }

  const set   = (data: ExtensionStore) => update(data)
  const reset = () => set(DEFAULT_STORE)

  return (
    <StoreContext.Provider
      value={{ store, set, update, reset }}
    >
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
