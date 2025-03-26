import { get_p2tr_address }    from '../../lib/wallet.js'
import { useExtensionStore }   from '../../stores/extension.js'

import Address      from './address.js'
import Balance      from './balance.js'
import Utxos        from './utxos.js'
import Transactions from './transactions.js'

import type { GroupPackage } from '@frostr/bifrost'
import type { ChainNetwork } from '../../types/index.js'
import { useEffect } from 'react'

export default function ({ showMessage }: { showMessage: (msg: string) => void }) {
  const { store, update } = useExtensionStore()

  const { 'explorer/network': network } = store.settings
  const address = get_address(store.node.group, network)

  useEffect(() => {
    if (address !== store.wallet.address) {
      update({ wallet: { ...store.wallet, address } })
    }
  }, [ address, update ])

  return (
    <div className="container">

      {/* Address Component */}
      <Address address={address} showMessage={showMessage} />
      
      {/* Balance Component */}
      <Balance address={address} showMessage={showMessage} />

      {/* UTXOs Component */}
      <Utxos address={address} showMessage={showMessage} />
        
      {/* Transactions Component */}
      <Transactions address={address} showMessage={showMessage} />
    </div>
  )
}

function get_address (
  group_pkg : GroupPackage | null,
  network   : ChainNetwork
) {
  if (group_pkg === null) return null
  return get_p2tr_address(group_pkg.group_pk.slice(2), network)
}
