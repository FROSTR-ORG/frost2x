import GroupPackageConfig    from './group.js'
import PeerNodeConfig        from './peers.js'
import RelayConfig           from './relays.js'
import SecretPackageConfig   from './share.js'
import { useExtensionStore } from '../../stores/extension.js'

import type { NodeStore } from '../../types/store.js'

export default function ({ showMessage }: { showMessage: (msg: string) => void }) {
  const { store, update } = useExtensionStore()

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
