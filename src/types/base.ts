export type ChainNetwork = 'mainnet' | 'testnet' | 'regtest'
export type TxPriority   = 'low' | 'medium' | 'high'

export type Literal      = string | number | boolean
export type Result<T>    = { ok: true, value: T } | { ok: false, err: string }
