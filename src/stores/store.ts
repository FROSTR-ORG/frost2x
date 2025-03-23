import browser from 'webextension-polyfill'

export function create_store <T = Record<string, unknown>> (
  store_key : string,
  defaults? : T
) {
  // Array to hold middleware functions
  const middlewares: Array<(store: T) => void> = []

  // Fetch the store.
  const fetch = async () => {
    return browser.storage.local
      .get(store_key)
      .then(res => (res[store_key] ?? defaults) as T)
  }
  // Reset the store.
  const reset = async (store? : T) => {
    console.info(`[ store/${store_key} ] reset store:`, store)
    return browser.storage.local
      .set({ [store_key]: store ?? defaults })
      .then(() => store ?? defaults)
  }
  // Update the store.
  const update = async (changes : Partial<T>) => {
    const old_store = await fetch()
    const new_store = { ...old_store, ...changes } as T
    // Call all middleware functions with the new store
    middlewares.forEach(middleware => middleware(new_store))
    console.info(`[ store/${store_key} ] update store:`, changes)
    return browser.storage.local
      .set({ [store_key]: new_store })
      .then(() => new_store)
  }
  // Subscribe to the store.
  const subscribe = (callback: (store: T) => void) => {
    const listener  = async (changes: any, areaName: string) => {
      if (areaName === 'local' && changes[store_key]) {
        callback(changes[store_key].newValue || {})
      }
    }
    browser.storage.onChanged.addListener(listener)
    return () => {
      browser.storage.onChanged.removeListener(listener)
    }
  }
  
  // Add middleware to the store
  const use = (middleware: (store: T) => void) => {
    middlewares.push(middleware)
    // Return unsubscribe function
    return () => {
      const index = middlewares.indexOf(middleware)
      if (index !== -1) {
        middlewares.splice(index, 1)
      }
    }
  }
  
  // Return the API to the store.
  return { fetch, reset, update, subscribe, use }
}
