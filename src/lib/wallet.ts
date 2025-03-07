import { bech32m } from '@scure/base'
import { Buff }    from '@cmdcode/buff'

import type {
  ChainNetwork,
  WalletAccount,
  WalletConnector,
  WalletUtxo
} from '../types/index.js'

import * as CONST from '../const.js'

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

function select_utxos (
  utxos : WalletUtxo[],
  amount : number
) {
  return []
}

function sign_psbt (
  psbt : string,
) {
  return ''
}
