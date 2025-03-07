import { useState, useEffect } from 'react'
import { decode_group_pkg }    from '@frostr/bifrost/lib'
import { sleep }               from '@frostr/bifrost/util'
import { get_p2tr_address }    from '../lib/wallet.js'
import { useStore }            from './store.js'

import {
  useAddressInfo,
  useUtxoSet,
  usePoolHistory,
  useChainHistory
} from '../hooks/explorer.js'

import Address      from './wallet/address.js'
import Balance      from './wallet/balance.js'
import Utxos        from './wallet/utxos.js'
import Transactions from './wallet/transactions.js'

import type { ChainNetwork } from '../types/index.js'

export default function ({ showMessage }: { showMessage: (msg: string) => void }) {
  const { store } = useStore()

  const { 'explorer/network': network } = store.settings
  const address = get_address(store.node.group, network)

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
  group_pkg : string | null,
  network   : ChainNetwork
) {
  if (group_pkg === null) return null
  const group = decode_group_pkg(group_pkg)
  return get_p2tr_address(group.group_pk.slice(2), network)
}
