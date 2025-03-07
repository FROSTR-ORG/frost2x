import type { PeerPolicy }  from '@frostr/bifrost'
import type { WalletStore } from './wallet.js'

import type { ChainNetwork, TxPriority } from './base.js'

export interface StoreAPI<T> {
  store  : T
  reset  : ()                   => void
  set    : (store : T)          => void
  update : (store : Partial<T>) => void
}

export interface ExtensionStore {
  init     : boolean
  node     : NodeStore
  settings : SettingStore
  wallet   : WalletStore
}

export interface RelayPolicy {
  url   : string
  read  : boolean
  write : boolean
}

export interface NodeStore {
  group   : string       | null
  peers   : PeerPolicy[] | null
  relays  : RelayPolicy[]
  share   : string       | null
}

export interface SettingStore {
  'explorer/api_url'      : string
  'explorer/link_url'     : string
  'explorer/network'      : ChainNetwork
  'explorer/rate_limit'   : number
  'general/notifications' : boolean
  'links/is_active'       : boolean
  'links/resolver_url'    : string
  'tx/default_priority'   : TxPriority
  'tx/max_fee_rate'       : number
  'tx/max_spend_amount'   : number
}

export interface ExtensionSettingsProps {
  settings : SettingStore
  update   : (settings: Partial<SettingStore>) => void
}
