import { useEffect, useState } from 'react'
import { ExtensionStore }      from '../types.js'

import browser from 'webextension-polyfill'

const DEFAULT_STORE : ExtensionStore = {
  init   : false as const,
  group  : null,
  server : null,
  share  : null
}

export default function () {

  const [ store, setStore ] = useState<ExtensionStore>(DEFAULT_STORE)

  const reset  = (data : ExtensionStore) => update(data)
  
  const update = (data : Partial<ExtensionStore>) => {
    const new_store = { ...store, ...data }
    browser.storage.sync.set({ store : new_store }).then(_ => {
      setStore(new_store)
      console.log('update store:', new_store)
    })
  }
  
  useEffect(() => {
    if (!store.init) {
      browser.storage.sync.get('store').then(results => {
        if (results.store) {
          setStore({ ...store, ...results.store, init : true })
          console.log('init store:', store)
        } else {
          reset({ ...store, init : true })
        }
      })
    }
    console.log('store:', store)
  }, [ store ])

  return { store, reset, update }
}
