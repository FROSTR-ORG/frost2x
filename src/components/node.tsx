import GroupPackageConfig  from './node/group.js'
import PeerNodeConfig      from './node/peers.js'
import RelayConfig         from './node/relays.js'
import SecretPackageConfig from './node/share.js'
import { useStore }        from './store.js'

import type { NodeStore } from '../types/index.js'

export default function ({ showMessage }: { showMessage: (msg: string) => void }) {
  const { store, update } = useStore()

  const update_node = (data: Partial<NodeStore>) => {
    update({ node: { ...store.node, ...data } })
  }

  return (
    <>
      <SecretPackageConfig update={update_node}/>
      <GroupPackageConfig  update={update_node}/>
      <PeerNodeConfig      update={update_node}/>
      <RelayConfig         update={update_node}/>
    </>
  )
}
