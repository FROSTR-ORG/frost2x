import { get_pubkey }     from '@frostr/bifrost/util'
import { DEFAULT_RELAYS } from '@/const.js'
import { create_store }   from './store.js'

import type { RelayPolicy } from '@/types/index.js'

import type {
  GroupPackage,
  PeerConfig,
  SharePackage,
} from '@frostr/bifrost'

interface Store {
  group   : GroupPackage | null
  peers   : PeerConfig[] | null
  relays  : RelayPolicy[]
  share   : SharePackage | null
}

const DEFAULT_STORE : Store = {
  group: null,
  peers: null,
  relays: DEFAULT_RELAYS,
  share: null,
}

const API = create_store<Store>('node', DEFAULT_STORE)

export namespace NodeStore {
  export type  Type    = Store
  export const DEFAULT = DEFAULT_STORE
  export const { fetch, reset, update, subscribe, use } = API
}

// Middleware to update the peers when the group changes.
NodeStore.use((store) => {
  if (store.group === null || store.share === null) {
    store.peers = null
  } else if (store.group !== null && store.share !== null && store.peers === null) {
    const pubkey = get_pubkey(store.share.seckey, 'ecdsa')
    const peers  = store.group.commits.filter(commit => commit.pubkey !== pubkey)
    store.peers = peers.map((peer, idx) => 
      ({ pubkey: peer.pubkey.slice(2), policy: { send: idx === 0, recv: true } })
    )
  }
})
