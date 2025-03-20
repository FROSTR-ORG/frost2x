export type WalletSignMainifest = Record<string, (number | SighashConfig)[]>
export type SighashEntry        = [ string, string, number ]

export interface SighashConfig {
  index     : number,
  code_sep? : number,
  annex?    : string
}

export interface SighashData {
  index   : number
  type    : 'script' | 'key'
  hash    : string
  sigtype : number
  tweak   : string | null
  version : number
}

export interface SignedSighashData extends SighashData {
  pubkey : string
  sig    : string
}

export interface WalletUtxo {
  txid   : string
  vout   : number
  value  : number
  script : string
}

export interface WalletStore {
  address  : string | null
  utxo_set : WalletStoreUtxo[]
}

export interface WalletStoreUtxo extends WalletUtxo {
  confirmed : boolean
  selected  : boolean
}
