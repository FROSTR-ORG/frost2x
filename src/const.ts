export const PROMPT_WIDTH  = 340
export const PROMPT_HEIGHT = 360

export const PERMISSION_BYPASS = {
  replace_url     : true,
  node_reset      : true,
  get_node_status : true
}

export const PERMISSION_NAMES = Object.fromEntries([
  ['getPublicKey',  'read your public key'],
  ['getRelays',     'read your list of preferred relays'],
  ['signEvent',     'sign events using your private key'],
  ['nip04.encrypt', 'encrypt messages to peers'],
  ['nip04.decrypt', 'decrypt messages from peers'],
  ['nip44.encrypt', 'encrypt messages to peers'],
  ['nip44.decrypt', 'decrypt messages from peers']
])
