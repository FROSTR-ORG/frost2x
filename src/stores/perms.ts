import { create_store } from './store.js'

import type { SignerPolicy, WalletPolicy } from '@/types/index.js'

export interface Store {
  signer  : SignerPolicy[]
  wallet  : WalletPolicy[]
}

const DEFAULT_STORE : Store = {  
  signer : [],
  wallet : []
}

const API = create_store<Store>('permissions', DEFAULT_STORE)

export namespace PermStore {
  export type  Type    = Store
  export const DEFAULT = DEFAULT_STORE
  export const { fetch, reset, update, subscribe, use } = API
}
