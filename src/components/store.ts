import { useEffect, useState, useCallback } from 'react'
import { ExtensionStore }      from '../types.js'

import browser from 'webextension-polyfill'

const DEFAULT_STORE : ExtensionStore = {
  init   : false as const,
  group  : null,
  peers  : null,
  share  : null
}

export default function () {

  const [ store, setStore ] = useState<ExtensionStore>(DEFAULT_STORE)

  // Debounced update to prevent rapid successive writes
  const update = useCallback((data: Partial<ExtensionStore>) => {
    setStore(prevStore => {
      const new_store = { ...prevStore, ...data }
      
      // Debounce the storage update
      setTimeout(() => {
        browser.storage.sync.set({ store: new_store }).then(() => {
          console.log('new store:', new_store)
        })
      }, 100)

      return new_store
    })
  }, [])

  const reset = useCallback((data: ExtensionStore) => update(data), [update])
  
  useEffect(() => {
    browser.storage.sync.get('store').then(results => {

      const new_store = {
        ...DEFAULT_STORE, 
        ...results.store ?? {},
        init: true 
      }
      
      // Only set if not already initialized
      if (results.store === undefined) {
        browser.storage.sync.set({ store: new_store })
      }
      
      setStore(new_store)
      console.log('init store:', new_store)
    })
  }, [])

  return { store, reset, update }
}
