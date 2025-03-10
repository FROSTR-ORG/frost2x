export const DUST_LIMIT    = 546
export const MAX_LOGS      = 100
export const PROMPT_WIDTH  = 500
export const PROMPT_HEIGHT = 700

export const NETWORK_PREFIX = {
  mainnet : 'bc',
  testnet : 'tb',
  regtest : 'bcrt'
}

export const PERMISSION_BYPASS = {
  store_updated   : true,
  replace_url     : true,
  node_reset      : true,
  get_node_status : true
}

export const PERMISSION_NAMES = Object.fromEntries([
  ['nostr.getPublicKey',  'read your public key'],
  ['nostr.getRelays',     'read your list of preferred relays'],
  ['nostr.signEvent',     'sign events using your private key'],
  ['nostr.nip04.encrypt', 'encrypt messages to peers'],
  ['nostr.nip04.decrypt', 'decrypt messages from peers'],
  ['nostr.nip44.encrypt', 'encrypt messages to peers'],
  ['nostr.nip44.decrypt', 'decrypt messages from peers'],
  ['wallet.getAccount',   'read your wallet account'],
  ['wallet.getBalance',   'read your wallet balance'],
  ['wallet.getUtxos',     'read your wallet utxos'],
  ['wallet.signPsbt',     'sign psbt transactions']
])
