import type { FrostrWallet } from '../lib/wallet.js'

import type {
  ExplorerTxData,
  ExplorerUtxoData,
  ExplorerAddressInfo
} from './explorer.js'

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
  address    : string              | null
  chain_info : ExplorerAddressInfo | null
  chain_txs  : ExplorerTxData[]
  pool_txs   : ExplorerTxData[]
  utxo_set   : ExplorerUtxoData[]
}
