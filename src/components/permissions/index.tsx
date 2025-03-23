import { useEffect, useState } from 'react'
import { PermStore }           from '@/stores/perms.js'

import SignerPermissions  from './signer.js'
import WalletPermissions  from './wallet.js'

export default function Permissions() {
  const [ store, setStore ] = useState<PermStore.Type>(PermStore.DEFAULT)

  useEffect(() => {
    PermStore.fetch().then(store => setStore(store))
    const unsub = PermStore.subscribe(store => setStore(store))
    return () => unsub()
  }, [])

  return (
    <>
      <SignerPermissions store={store} />
      {/* <div className="section-separator"></div> */}
      {/* <WalletPermissions showMessage={showMessage} /> */}
      {/* <div className="section-separator"></div> */}
    </>
  )
}
