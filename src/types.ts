
export interface ExtensionStore {
  init   : boolean
  group  : string | null
  server : string | null
  share  : string | null
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
  openSignUp?: boolean
  prompt?: boolean
  type?: string
  params?: any
  host?: string
  accept?: boolean
  conditions?: any
}

export interface ContentScriptMessage {
  type: string
  params: any
  host?: string
}

export type PermissionType = 'replaceURL' | 'getPublicKey' | 'getRelays' | 'signEvent' | 'nip04.encrypt' | 'nip04.decrypt'

export interface Store {
  server: string
}

export interface ProfilePointer {
  pubkey: string
  relays?: string[]
}

export interface EventPointer {
  id: string
  relays?: string[]
}

export interface Nip19Data {
  type: string
  data: string | ProfilePointer | EventPointer
}

export interface Relay {
  url: string
  policy: {
    read: boolean
    write: boolean
  }
}

export interface Permission {
  host: string
  type: string
  accept: string
  conditions: {
    kinds?: Record<string, boolean>
    [key: string]: any
  }
  created_at: number
}
