import type { GroupPackage, PeerPolicy, SharePackage }  from '@frostr/bifrost'

import type { WalletStore }              from './wallet.js'
import type { ChainNetwork, TxPriority } from './base.js'

import {
  AddressPermission,
  SignerPermission,
  WalletPermission
} from './permission.js'

export interface StoreAPI<T> {
  store  : T
  reset  : ()                   => void
  set    : (store : T)          => void
  update : (store : Partial<T>) => void
}

export interface ExtensionStore {
  init        : boolean
  node        : NodeStore
  permissions : PermissionStore
  settings    : SettingStore
  wallet      : WalletStore
}

export interface RelayPolicy {
  url   : string
  read  : boolean
  write : boolean
}

export interface NodeStore {
  group   : GroupPackage | null
  peers   : PeerPolicy[] | null
  relays  : RelayPolicy[]
  share   : SharePackage | null
}

export interface PermissionStore {
  address : AddressPermission[]
  signer  : SignerPermission[]
  wallet  : WalletPermission[]
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
