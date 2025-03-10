import type { NostrEvent } from './nostr.js'

export interface BasePermission {
  host       : string
  type       : string
  accept     : string
  created_at : number
}

export interface AddressPermission extends BasePermission {
  xpub: string
}

export interface SignerPermission extends BasePermission {
  conditions: SignerConditions
}

export interface WalletPermission extends BasePermission {}

export interface SignerConditions {
  kinds?        : Record<number, boolean>
  [key: string] : any
}

export interface SignerNotificationParams {
  event?        : NostrEvent
  [key: string] : any
}

export interface WalletNotificationParams {
  psbt?         : string
  [key: string] : any
}
