export interface ExplorerAddressInfo {
  address       : string
  chain_stats   : ExplorerAddrStats
  mempool_stats : ExplorerAddrStats
}

export interface ExplorerAddrStats {
  funded_txo_count : number
  funded_txo_sum   : number
  spent_txo_count  : number
  spent_txo_sum    : number
  tx_count         : number
}

export interface ExplorerTxData {
  txid     : string
  version  : number
  locktime : number
  vin      : ExplorerTxIn[]
  vout     : ExplorerTxOut[]
  size     : number
  weight   : number
  fee      : number
  status   : ExplorerTxStatus
}

export interface ExplorerTxIn {
  txid          : string
  vout          : number
  prevout       : ExplorerTxOut
  scriptsig     : string
  scriptsig_asm : string
  is_coinbase   : boolean
  sequence      : number
}

export interface ExplorerTxOut {
  scriptpubkey         : string
  scriptpubkey_asm     : string
  scriptpubkey_type    : string
  scriptpubkey_address : string
  value                : number
}

export interface ExplorerUtxoData {
  txid   : string
  vout   : number
  status : ExplorerTxStatus
  value  : number
}

export interface ExplorerTxStatus {
  confirmed    : boolean
  block_height : number
  block_hash   : string
  block_time   : number
}
