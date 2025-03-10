import type { FrostrWallet }     from '../lib/wallet.js'
import type { ExplorerUtxoData } from './explorer.js'

export type WalletSignMainifest = Record<string, number[]>

export interface WalletUtxo {
  txid   : string
  vout   : number
  value  : number
  script : string
}

export interface WalletAccount {
  payment : { address : string, pubkey : string }
  change  : { address : string, pubkey : string }
  meta    : { address : string, pubkey : string }
}

export interface WalletConnector {
  signPsbt : (wallet : FrostrWallet) => (psbt : string, manifest : WalletSignMainifest) => Promise<string>
}

export interface WalletStore {
  address  : string | null
  utxo_set : WalletStoreUtxo[]
}

export interface WalletUtxo {
  txid   : string
  vout   : number
  value  : number
  script : string
}

export interface WalletStoreUtxo extends WalletUtxo {
  confirmed : boolean
  selected : boolean
}
