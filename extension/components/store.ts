import { useEffect, useState } from 'react'
import { ExtensionStore }      from '../types.js'

import browser from 'webextension-polyfill'

const DEFAULT_STORE = {
  sign_server_host : ''
}

export default function () {

  const [ store, setStore ] = useState<ExtensionStore>(DEFAULT_STORE)

  const reset  = (data : ExtensionStore) => update(data)
  
  const update = (data : Partial<ExtensionStore>) => {
    const new_store = { ...store, ...data }
    browser.storage.local.set({ store : new_store }).then(_ => {
      setStore(new_store)
    })
  }
  
  useEffect(() => {
    browser.storage.local.get(['store']).then(results => {
      if (results.store) {
        reset(results.store as ExtensionStore)
      }
    })
  }, [])

  return { store, reset, update }
}
