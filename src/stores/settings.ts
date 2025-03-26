import { create_store } from './store.js'

import type { ChainNetwork, TxPriority } from '@/types/index.js'

interface Store {
  explorer : {
    api_url      : string
    link_url     : string
    network      : ChainNetwork
    rate_limit   : number
  }
  general : {
    notifications : boolean
  }
  links : {
    is_active       : boolean
    resolver_url    : string
  }
  node : {
    rate_limit : number
  }
  tx : {
    default_priority   : TxPriority
    max_fee_rate       : number
    max_spend_amount   : number
  }
}

const DEFAULT_STORE : Store = {
  explorer : {
    api_url      : 'https://mempool.space/api',
    link_url     : 'https://mempool.space',
    network      : 'mainnet',
    rate_limit   : 5000,
  },
  general : {
    notifications : false,
  },
  links : {
    is_active       : false,
    resolver_url    : 'https://njump.me/{raw}',
  },
  node : {
    rate_limit : 200,
  },
  tx : {
    default_priority   : 'medium',
    max_fee_rate       : 1000,
    max_spend_amount   : 1000000,
  }
}

const API = create_store<Store>('settings', DEFAULT_STORE)

export namespace SettingStore {
  export type  Type    = Store
  export const DEFAULT = DEFAULT_STORE
  export const { fetch, reset, update, subscribe, use } = API
}
