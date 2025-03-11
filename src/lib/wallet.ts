import { bech32m } from '@scure/base'
import { Buff }    from '@cmdcode/buff'

import type {
  ChainNetwork,
  Result,
  WalletAccount,
  WalletConnector,
  WalletSignMainifest,
  WalletStoreUtxo,
  WalletUtxo
} from '../types/index.js'

import * as CONST from '../const.js'
import * as PSBT from '../util/psbt.js'
const RANDOM_SORT = () => Math.random() > 0.5 ? 1 : -1

export class FrostrWallet {
  private readonly _account   : WalletAccount
  private readonly _connector : WalletConnector
  private readonly _domain    : string
  private readonly _pubkey    : string

  private _utxos : WalletUtxo[] = []

  constructor (
    connector : WalletConnector,
    domain    : string,
    pubkey    : string
  ) {
    // Tweak pubkey with taghash(type, domain, pubkey)
    this._account   = derive_accounts(domain, pubkey)
    this._connector = connector
    this._domain    = domain
    this._pubkey    = pubkey
  }

  get account() {
    return this._account
  }

  get connector() {
    return this._connector
  }

  get domain() {
    return this._domain
  }

  get pubkey() {
    return this._pubkey
  }

  async getBalance () {
    // Get the balance for the 
    return 0
  }

  async getUtxos(amount: number) {
    return this._utxos
  }

  async signPsbt (psbt: string) {
    return ''
  }
}

function derive_accounts (
  domain : string,
  pubkey : string
) {
  // Get the tweaked pubkeys for the given domain, and convert to bech32m addresses.
  return {
    payment : { address : '', pubkey : '' },
    change  : { address : '', pubkey : '' },
    meta    : { address : '', pubkey : '' }
  }
}

export function get_p2tr_address (
  pubkey  : string,
  network : ChainNetwork
) {
  const prefix = CONST.NETWORK_PREFIX[network]
  const bytes  = Buff.hex(pubkey)
  const words  = [ 1, ...bech32m.toWords(bytes) ]
  return bech32m.encode(prefix, words)
}

export function filter_utxos (utxos : WalletStoreUtxo[]) {
  return utxos
    .filter(utxo => utxo.confirmed && utxo.selected)
    .map(({ txid, vout, value, script }) => ({ txid, vout, value, script }))
}

export function select_utxos (
  utxos  : WalletUtxo[],
  amount : number,
  sorter = RANDOM_SORT
) : Result<WalletUtxo[]> {
  const selected : WalletUtxo[] = []

  let total = 0

  utxos.sort(sorter)

  for (const utxo of utxos) {
    selected.push(utxo)
    total += utxo.value
    if (total > amount + CONST.DUST_LIMIT) {
      return { ok: true, value: selected }
    }
  }

  return { ok: false, err: `insufficient sats: total(${total}) < amount(${amount}) + dust(${CONST.DUST_LIMIT})` }
}

export function get_utxo_balance (utxos : WalletUtxo[]) {
  return utxos.reduce((acc, utxo) => acc + utxo.value, 0)
}

/**
 * TODO:
 * - We have to collect the sighashes first.
 * - then we have to pass them to the node to collect the signatures.
 * - then we have to finalize the PSBT.
 * - this means we have to detect p2tr key spending, and script spending.
 * - p2tr key spending should be tweaked by default
 * - p2tr script spending should commit to the script in the sighash.
 */

// export function get_psbt_sighashes (
//   psbt     : string,
//   manifest : WalletSignMainifest
// ) {
//   const pdata = PSBT.parse_psbt(psbt)
//   const sighashes : string[] = []
//   for (let idx = 0; idx < pdata.inputsLength; idx++) {
//     try {
//       const txinput = pdata.getInput(idx)
//       const prevout = txinput.witnessUtxo
//       if (prevout === undefined) continue
      
//     }
//     return PSBT.encode_psbt(pdata)
//   }
// }

// export function update_psbt (
//   psbt     : string | Transaction,
//   manifest : WalletSignMainifest
// ) {
//   return ''
// }
