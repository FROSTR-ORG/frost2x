import browser from 'webextension-polyfill'

import { MESSAGE_TYPE } from '../const.js'

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from 'react'

import type { ReactNode } from 'react'
import type { StoreAPI }  from '../types/index.js'

// ============================================================================
// SECTION 1: Configuration and Constants
// ============================================================================

const DEBUG = true; // Enable debug logging

// ============================================================================
// SECTION 2: Utility Functions
// ============================================================================

// Deep merge two objects, preserving nested structures
function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target } as any;
  for (const key in source) {
    if (source[key] !== undefined) {
      if (isPlainObject(target[key]) && isPlainObject(source[key])) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        output[key] = source[key];
      }
    }
  }
  return output;
}

// Check if a value is a plain object (not an array or Date)
function isPlainObject(value: any): boolean {
  return value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);
}

// ============================================================================
// SECTION 3: Store Data Access (For Background and React)
// ============================================================================

// Fetch the store from browser.storage.local
async function fetchStore<T extends { init: boolean }>(storeName: string, config: T): Promise<T> {
  try {
    const result = await browser.storage.local.get(storeName) as { [key: string]: T };
    const existing = result[storeName];
    if (!existing) {
      const initialStore = { ...config, init: true } as T;
      await browser.storage.local.set({ [storeName]: initialStore });
      if (DEBUG) console.log(`[${storeName}] Initialized store:`, initialStore);
      return initialStore;
    }
    const mergedStore = deepMerge(config, existing);
    if (!existing.init) {
      mergedStore.init = true;
      await browser.storage.local.set({ [storeName]: mergedStore });
    }
    if (DEBUG) console.log(`[${storeName}] Fetched store:`, mergedStore);
    return mergedStore;
  } catch (error) {
    console.error(`[${storeName}] FetchStore failed:`, error);
    throw error;
  }
}

// Update the store in browser.storage.local and notify listeners
async function updateStoreInDB<T>(storeName: string, newStore: T): Promise<void> {
  try {
    await browser.storage.local.set({ [storeName]: newStore })
    if (DEBUG) console.log(`[${storeName}] Updated store in DB:`, newStore)
    // Notify all listeners (React and background) of the update
    const message = { type: MESSAGE_TYPE.STORE_UPDATE, name : storeName, data: newStore }
    browser.runtime.sendMessage(message).catch((err) =>
      console.warn(`[${storeName}] Failed to send update message:`, err)
    )
  } catch (error) {
    console.error(`[${storeName}] UpdateStoreInDB failed:`, error)
    throw error
  }
}

// ============================================================================
// SECTION 4: Store Factory
// ============================================================================

export function createStore<T extends { init: boolean }>(storeName: string, config: T) {
  // Load store for React initialization
  async function loadStore(): Promise<T> {
    return fetchStore(storeName, config);
  }

  // Persist store to browser.storage.local from React
  async function persistStore(newStore: T): Promise<void> {
    return updateStoreInDB(storeName, newStore);
  }

  // Subscribe to store updates with a callback (for background or other listeners)
  function subscribeToStoreUpdates(callback: (newStore: T) => void): () => void {
    const listener = (message: any) => {
      if (message.type === MESSAGE_TYPE.STORE_UPDATE && message.name === storeName) {
        const updatedStore = deepMerge(config, message.data);
        if (DEBUG) console.log(`[${storeName}] Subscription triggered:`, updatedStore);
        callback(updatedStore);
      }
      return undefined;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }

  // Custom hook for React components
  function useStore(): StoreAPI<T> {
    const [store, setStore] = useState<T>(config);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      let mounted = true;

      loadStore()
        .then((initialStore) => {
          if (mounted) {
            setStore(initialStore);
            setIsLoaded(true);
            if (DEBUG) console.log(`[${storeName}] Store loaded:`, initialStore);
          }
        })
        .catch((error) => {
          console.error(`[${storeName}] Failed to load store:`, error);
          if (mounted) setIsLoaded(true);
        });

      const unsubscribe = subscribeToStoreUpdates((newStore) => {
        if (mounted) {
          setStore(newStore);
          if (DEBUG) console.log(`[${storeName}] Store updated via subscription:`, newStore);
        }
      });

      return () => {
        mounted = false;
        unsubscribe();
      };
    }, []);

    const reset = useCallback(async () => {
      const newStore = { ...config, init: true } as T;
      setStore(newStore);
      await persistStore(newStore);
    }, []);

    const set = useCallback(async (newStore: T) => {
      const mergedStore = deepMerge(config, newStore);
      mergedStore.init = true;
      setStore(mergedStore);
      await persistStore(mergedStore);
    }, []);

    const update = useCallback(async (data: Partial<T>) => {
      setStore((prev) => {
        const newStore = deepMerge(prev, data);
        newStore.init = true;
        persistStore(newStore); // Fire-and-forget
        return newStore;
      });
    }, []);

    return {
      store: isLoaded ? store : config,
      reset,
      set,
      update,
    };
  }

  const StoreContext = createContext<StoreAPI<T> | null>(null);

  function StoreProvider({ children }: { children: ReactNode }): ReactNode {
    const storeAPI = useStore();
    return <StoreContext.Provider value={storeAPI}>{children}</StoreContext.Provider>;
  }

  function useStoreContext(): StoreAPI<T> {
    const context = useContext(StoreContext);
    if (!context) {
      throw new Error(`useStoreContext for '${storeName}' must be used within its StoreProvider`);
    }
    return context;
  }

  return {
    StoreProvider,
    useStore      : useStoreContext,
    fetchStore    : () => fetchStore(storeName, config),
    updateStore   : (newStore: T) => updateStoreInDB(storeName, newStore),
    onStoreUpdate : subscribeToStoreUpdates,
  };
}

// ============================================================================
// SECTION 5: Utility Functions
// ============================================================================

export async function clearStore(storeName: string): Promise<void> {
  try {
    await browser.storage.local.remove(storeName);
    if (DEBUG) console.log(`[${storeName}] Store cleared`);
  } catch (error) {
    console.error(`[${storeName}] ClearStore failed:`, error);
    throw error;
  }
}