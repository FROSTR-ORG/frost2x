export type ChainNetwork = 'mainnet' | 'testnet' | 'regtest'
export type TxPriority   = 'low' | 'medium' | 'high'

export type Literal      = string | number | boolean
export type Result<T>    = { ok: true, value: T } | { ok: false, err: string }

// Re-export store types for convenience
export type { ExtensionStore } from '@/stores/extension.js'

// Import and re-export SettingStore namespace
import { SettingStore as SettingStoreNS } from '@/stores/settings.js'
export type SettingStore = SettingStoreNS.Type
