export const DUST_LIMIT    = 546
export const MAX_LOGS      = 100
export const PROMPT_WIDTH  = 500
export const PROMPT_HEIGHT = 700

export const NETWORK_PREFIX = {
  mainnet : 'bc',
  testnet : 'tb',
  regtest : 'bcrt'
} as const

export const ALLOWED_WITNESS_VERSIONS = [ 0x51 ]

export const POLICY_DOMAIN = {
  NOSTR   : 'nostr',
  BITCOIN : 'bitcoin'
} as const

export const STORE_KEY = {
  SIGNER_PERMISSIONS : 'signer_perms',
  WALLET_PERMISSIONS : 'wallet_perms'
}

export const NOSTR_MSG_TYPE = {
  GET_PUBLIC_KEY : 'nostr.getPublicKey',
  GET_RELAYS     : 'nostr.getRelays',
  SIGN_EVENT     : 'nostr.signEvent',
  NIP04_ENCRYPT  : 'nostr.nip04.encrypt',
  NIP04_DECRYPT  : 'nostr.nip04.decrypt',
  NIP44_ENCRYPT  : 'nostr.nip44.encrypt',
  NIP44_DECRYPT  : 'nostr.nip44.decrypt',
  GET_ACCOUNT    : 'nostr.getAccount' 
} as const

export const BITCOIN_MSG_TYPE = {
  GET_ACCOUNT : 'bitcoin.getAccount',
  GET_BALANCE : 'bitcoin.getBalance',
  GET_UTXOS   : 'bitcoin.getUtxos',
  SIGN_PSBT   : 'bitcoin.signPsbt'
} as const

export const SYSTEM_MESSAGE_TYPE = {
  STORE_UPDATE : 'store.update',
  NODE_RESET   : 'node.reset',
  NODE_STATUS  : 'node.status',
  URL_REPLACE  : 'url.replace'
} as const

export const MESSAGE_TYPE = {
  ...SYSTEM_MESSAGE_TYPE,
  ...NOSTR_MSG_TYPE,
  ...BITCOIN_MSG_TYPE
} as const

export const PERMISSION_BYPASS : Record<string, boolean> = {
  [MESSAGE_TYPE.STORE_UPDATE] : true,
  [MESSAGE_TYPE.NODE_RESET]   : true,
  [MESSAGE_TYPE.NODE_STATUS]  : true,
  [MESSAGE_TYPE.URL_REPLACE]  : true
} as const

export const PERMISSION_LABELS = {
  [MESSAGE_TYPE.GET_PUBLIC_KEY] : 'read your public key',
  [MESSAGE_TYPE.GET_RELAYS]     : 'read your list of preferred relays',
  [MESSAGE_TYPE.SIGN_EVENT]     : 'sign events using your private key',
  [MESSAGE_TYPE.NIP04_ENCRYPT]  : 'encrypt messages to peers',
  [MESSAGE_TYPE.NIP04_DECRYPT]  : 'decrypt messages from peers',
  [MESSAGE_TYPE.NIP44_ENCRYPT]  : 'encrypt messages to peers',
  [MESSAGE_TYPE.NIP44_DECRYPT]  : 'decrypt messages from peers',
  [MESSAGE_TYPE.GET_ACCOUNT]    : 'read your wallet address',
  [MESSAGE_TYPE.GET_BALANCE]    : 'read your wallet balance',
  [MESSAGE_TYPE.GET_UTXOS]      : 'read your wallet utxos',
  [MESSAGE_TYPE.SIGN_PSBT]      : 'sign psbt transactions'
} as const
