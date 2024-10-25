import type {} from '@cmdcode/bifrost'

export interface ExtensionStore {
  group_pkg   : string | null
  secret_pkg  : string | null
  server_host : string | null
}

export interface StoreAPI {
  store  : ExtensionStore
  reset  : (store : ExtensionStore)          => void
  update : (store : Partial<ExtensionStore>) => void
}
