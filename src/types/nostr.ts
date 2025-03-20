export interface EventTemplate {
  kind    : number
  content : string
  tags    : string[]
  [key: string] : any
}

export interface NostrEvent {
  kind: number
  content: string
  tags: string[]
  [key: string]: any
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

export interface SignRequest {
  id      : string
  tmpl    : EventTemplate
  resolve : (result: any) => void
  reject  : (error: any) => void
}