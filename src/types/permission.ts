import { NostrEvent } from "./nostr.js"

export interface Conditions {
  kinds?        : Record<number, boolean>
  [key: string] : any
}

export interface Policy {
  conditions: Conditions
  created_at: number
}

export interface PolicyMap {
  [host: string]: {
    [accept: string]: {
      [type: string]: Policy
    }
  }
}

export interface PublishPermissions {
  host   : string
  type   : string
  accept : string
  conditions: {
    kinds? : Record<string, boolean>
    [key: string]: any
  }
  created_at : number
}

export interface NotificationParams {
  event?        : NostrEvent
  [key: string] : any
}
