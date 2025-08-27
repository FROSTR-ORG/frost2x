import { get_pubkey }     from '@frostr/bifrost/util'
import { DEFAULT_RELAYS } from '@/const.js'
import { create_store }   from './store.js'

import type { RelayPolicy } from '@/types/index.js'

import type {
  GroupPackage,
  PeerConfig,
  SharePackage,
} from '@frostr/bifrost'

// Normalize hex pubkeys to lowercase without 0x prefix
function normalizeKey(key: string): string {
  if (!key) return key
  return key.replace(/^0[xX]/, '').toLowerCase()
}

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

// Middleware to migrate legacy peer data format
API.use((store) => {
  if (store.peers && Array.isArray(store.peers)) {
    store.peers = store.peers.map(peer => {
      // Detect legacy tuple format: [pubkey, send, recv]
      if (Array.isArray(peer) && peer.length === 3 && typeof peer[0] === 'string') {
        return {
          pubkey: normalizeKey(peer[0]),
          policy: { send: peer[1], recv: peer[2] }
        }
      }
      // Already in correct format, just normalize the pubkey
      if (peer && typeof peer === 'object' && 'pubkey' in peer) {
        return {
          ...peer,
          pubkey: normalizeKey(peer.pubkey)
        }
      }
      return peer
    })
  }
})

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
    const pubkey = normalizeKey(get_pubkey(store.share.seckey, 'ecdsa'))
    const peers  = store.group.commits.filter(commit => 
      normalizeKey(commit.pubkey) !== pubkey
    )
    store.peers = peers.map((peer, idx) => 
      ({ pubkey: normalizeKey(peer.pubkey), policy: { send: idx === 0, recv: true } })
    )
  }
})
