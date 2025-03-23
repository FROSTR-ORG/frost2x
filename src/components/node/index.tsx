import { useEffect, useState } from 'react'
import { NodeStore }           from '@/stores/node.js'

import GroupPackageConfig    from './group.js'
import PeerNodeConfig        from './peers.js'
import RelayConfig           from './relays.js'
import SecretPackageConfig   from './share.js'

export default function () {
  const [ store, setStore ] = useState<NodeStore.Type>(NodeStore.DEFAULT)
  
  useEffect(() => {
    NodeStore.fetch().then(store => setStore(store))
    const unsub = NodeStore.subscribe(store => setStore(store))
    return () => unsub()
  }, [])

  return (
    <>
      <SecretPackageConfig store={store} />
      <GroupPackageConfig  store={store} />
      <PeerNodeConfig      store={store} />
      <RelayConfig         store={store} />
    </>
  )
}
