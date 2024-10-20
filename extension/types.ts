export interface ExtensionStore {
  sign_server_host : string
}

export interface StoreAPI {
  store  : ExtensionStore
  reset  : (store : ExtensionStore)          => void
  update : (store : Partial<ExtensionStore>) => void
}
