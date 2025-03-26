import * as CONST from '../const.js'

import type { NostrEvent } from './nostr.js'

export type PolicyDomain  = typeof CONST.POLICY_DOMAIN[keyof typeof CONST.POLICY_DOMAIN]
export type PolicyMethod  = typeof CONST.MESSAGE_TYPE[keyof typeof CONST.MESSAGE_TYPE]
export type PolicyAccept  = 'true' | 'false'

export interface BasePolicy {
  host       : string
  type       : PolicyMethod
  accept     : PolicyAccept
  created_at : number
}

export interface SignerPolicy extends BasePolicy {
  conditions? : SignerPolicyConditions
  params?     : SignerPolicyParams
}

export interface SignerPolicyConditions {
  kinds?        : Record<number, boolean>
  [key: string] : any
}

export interface SignerPolicyParams {
  event?        : NostrEvent
  [key: string] : any
}

export interface WalletPolicy extends BasePolicy {
  params? : WalletPolicyParams
}

export interface WalletPolicyParams {
  psbt?         : string
  [key: string] : any
}
