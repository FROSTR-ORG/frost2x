import { PeerPolicy } from '@frostr/bifrost'

export interface ExtensionStore {
  group    : string       | null
  peers    : PeerPolicy[] | null
  relays   : RelayPolicy[]
  settings : ExtensionSettings
  share    : string       | null
}

export interface StoreAPI {
  store  : ExtensionStore
  reset  : (store : ExtensionStore)          => void
  update : (store : Partial<ExtensionStore>) => void
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

export interface Conditions {
  kinds?        : Record<number, boolean>
  [key: string] : any
}

export interface NotificationParams {
  event?        : NostrEvent
  [key: string] : any
}

export interface NostrEvent {
  kind: number
  content: string
  tags: string[]
  [key: string]: any
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

export interface ContentScriptMessage {
  type   : string
  params : any
  host  ?: string
}

export type PermissionType = 'replaceURL' | 'getPublicKey' | 'getRelays' | 'signEvent' | 'nip04.encrypt' | 'nip04.decrypt'

export interface Store {
  server: string
}

export interface ProfilePointer {
  pubkey  : string
  relays? : string[]
}

export interface EventPointer {
  id      : string
  relays? : string[]
}

export interface Nip19Data {
  type : string
  data : string | ProfilePointer | EventPointer
}

export interface RelayPolicy {
  url   : string
  read  : boolean
  write : boolean
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

export interface ExtensionSettings {
  'general/show_notifications' : boolean
  'links/is_active'            : boolean
  'links/resolver_url'         : string | null
}

export interface ExtensionSettingsProps {
  settings : ExtensionSettings
  update   : (settings: Partial<ExtensionSettings>) => void
}
