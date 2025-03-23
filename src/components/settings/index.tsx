import { useEffect, useState } from 'react'

import { SettingStore } from '@/stores/settings.js'

import ExplorerSettings    from './explorer.js'
import GeneralSettings     from './general.js'
import TransactionSettings from './transaction.js'
import LinkSettings        from './links.js'
import DevSettings         from './dev.js'

export default function Settings() {
  const [ store, setStore ] = useState<SettingStore.Type>(SettingStore.DEFAULT)
  
  useEffect(() => {
    SettingStore.fetch().then(store => setStore(store))
    const unsub = SettingStore.subscribe(store => setStore(store))
    return () => unsub()
  }, [])

  return (
    <div className="container">
      <GeneralSettings store={store} />
      {/* <ExplorerSettings    /> */}
      {/* <TransactionSettings /> */}
      {/* <LinkSettings        /> */}
      <DevSettings />
    </div>
  )
}
