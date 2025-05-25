export interface RelayPolicy {
  url   : string
  read  : boolean
  write : boolean
}

export interface PeerStatus {
  pubkey  : string
  status  : 'online' | 'offline' | 'checking'
  updated : number
}