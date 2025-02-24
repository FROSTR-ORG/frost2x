import { useEffect, useState } from 'react'
import { ExtensionStore }      from '../types.js'

import browser from 'webextension-polyfill'

const DEBUG = true

const DEFAULT_STORE : ExtensionStore = {
  group  : null,
  peers  : null,
  share  : null
}

export default function () {
  const [ store, setStore ]  = useState<ExtensionStore>(DEFAULT_STORE)
  const [ is_init, setInit ] = useState(false)

  useEffect(() => {
    if (!is_init) {
      browser.storage.sync.get('store').then(results => {
        const new_store = { ...store, ...(results.store ?? {}) }
        setInit(true)
        setStore(new_store)
        if (DEBUG) console.log('init store:', new_store)
      })
    }
  }, [ is_init ])

  const update = (data: Partial<ExtensionStore>) => {
    const new_store = { ...store, ...data }
    
    if (DEBUG) console.log('updating store:', new_store)
    
    browser.storage.sync.set({ store: new_store }).then(() => {
      // setStore(new_store)
      if (DEBUG) console.log('updated store:', new_store)
    })
  }

  const set   = (data: ExtensionStore) => update(data)
  const reset = () => set(DEFAULT_STORE)
  
  useEffect(() => {
    const listener = (changes: any) => {
      const new_store = changes.store?.newValue
      if (new_store !== undefined) {
        setStore(new_store)
        if (DEBUG) console.log('store changed:', new_store)
      }
    }
    
    browser.storage.sync.onChanged.addListener(listener)
    return () => browser.storage.sync.onChanged.removeListener(listener)
  }, [ store ])

  return { store, set, update, reset }
}
