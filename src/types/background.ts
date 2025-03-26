import type { BifrostNode } from '@frostr/bifrost'
import type { Mutex }       from 'async-mutex'

import type { PolicyMethod, SignerPolicyConditions } from './perm.js'

// export type PermissionType = 'replaceURL' | 'getPublicKey' | 'getRelays' | 'signEvent' | 'nip04.encrypt' | 'nip04.decrypt'

export interface GlobalState {
  mutex  : PromptMutex
  prompt : PromptResolver | null
  node   : BifrostNode    | null
}

export interface PromptMutex {
  lock    : Mutex
  release : () => void
}

export interface PromptResolver {
  resolve : (value: boolean | PromiseLike<boolean>) => void
  reject  : (reason?: any) => void
}

export interface GlobalMessage {
  openSignUp ?: boolean
  prompt     ?: boolean
  type       ?: PolicyMethod
  params     ?: any
  host       ?: string
  accept     ?: boolean
  conditions ?: SignerPolicyConditions
}

export interface PromptMessage {
  id     : string
  host   : string
  type   : string
  params ?: any
}

export interface ContentScriptMessage {
  type   : string
  params : any
  host  ?: string
}
