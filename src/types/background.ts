import type { BifrostNode } from '@frostr/bifrost'
import type { Mutex }       from 'async-mutex'

export type PermissionType = 'replaceURL' | 'getPublicKey' | 'getRelays' | 'signEvent' | 'nip04.encrypt' | 'nip04.decrypt'

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

export interface Message {
  openSignUp ?: boolean
  prompt     ?: boolean
  type       ?: string
  params     ?: any
  host       ?: string
  accept     ?: boolean
  conditions ?: any
}

export interface ContentScriptMessage {
  type   : string
  params : any
  host  ?: string
}
