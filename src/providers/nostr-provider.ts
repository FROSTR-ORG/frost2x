import { MESSAGE_TYPE } from '@/const.js'

// First declare the window nostr property type
declare global {
  interface Window {
    nostr: {
      _requests: Record<string, { resolve: (value: any) => void, reject: (error: Error) => void }>;
      _pubkey: string | null;
      getPublicKey(): Promise<string>;
      signEvent(event: any): Promise<any>;
      getRelays(): Promise<any>;
      nip04: {
        encrypt(peer: string, plaintext: string): Promise<string>;
        decrypt(peer: string, ciphertext: string): Promise<string>;
      };
      nip44: {
        encrypt(peer: string, plaintext: string): Promise<string>;
        decrypt(peer: string, ciphertext: string): Promise<string>;
      };
      _call(type: string, params: Record<string, any>): Promise<any>;
    }
  }
}

window.nostr = {
  _requests : {},
  _pubkey   : null,

  async getPublicKey() {
    if (this._pubkey === null) {
      this._pubkey = await this._call('nostr.getPublicKey', {})
    }
    if (typeof this._pubkey !== 'string') {
      throw new Error('Failed to get public key')
    }
    return this._pubkey
  },

  async signEvent(event: any) {
    return this._call(MESSAGE_TYPE.SIGN_EVENT, { event })
  },

  async getRelays() {
    return this._call(MESSAGE_TYPE.GET_RELAYS, {})
  },

  nip04: {
    async encrypt(peer: string, plaintext: string) {
      return window.nostr._call(MESSAGE_TYPE.NIP04_ENCRYPT, {peer, plaintext})
    },

    async decrypt(peer: string, ciphertext: string) {
      return window.nostr._call(MESSAGE_TYPE.NIP04_DECRYPT, {peer, ciphertext})
    }
  },

  nip44: {
    async encrypt(peer: string, plaintext: string) {
      return window.nostr._call(MESSAGE_TYPE.NIP44_ENCRYPT, {peer, plaintext})
    },

    async decrypt(peer: string, ciphertext: string) {
      return window.nostr._call(MESSAGE_TYPE.NIP44_DECRYPT, {peer, ciphertext})
    }
  },

  _call(type: string, params: Record<string, any>) {
    let id = Math.random().toString().slice(-4)
    console.log(
      '%c[frost2x:%c' +
        id +
        '%c]%c calling %c' +
        type +
        '%c with %c' +
        JSON.stringify(params || {}),
      'background-color:#f1b912;font-weight:bold;color:white',
      'background-color:#f1b912;font-weight:bold;color:#a92727',
      'background-color:#f1b912;color:white;font-weight:bold',
      'color:auto',
      'font-weight:bold;color:#08589d;font-family:monospace',
      'color:auto',
      'font-weight:bold;color:#90b12d;font-family:monospace'
    )
    return new Promise((resolve, reject) => {
      this._requests[id] = {resolve, reject}
      window.postMessage(
        {
          id,
          ext: 'frost2x',
          type,
          params
        },
        '*'
      )
    })
  }
}

window.addEventListener('message', message => {
  if (
    !message.data ||
    message.data.response === null ||
    message.data.response === undefined ||
    message.data.ext !== 'frost2x' ||
    !window.nostr._requests[message.data.id]
  )
    return

  if (message.data.response.error) {
    let error = new Error('frost2x: ' + message.data.response.error.message)
    error.stack = message.data.response.error.stack
    window.nostr._requests[message.data.id].reject(error)
  } else {
    window.nostr._requests[message.data.id].resolve(message.data.response)
  }

  console.log(
    '%c[frost2x:%c' +
      message.data.id +
      '%c]%c result: %c' +
      JSON.stringify(
        message?.data?.response || message?.data?.response?.error?.message || {}
      ),
    'background-color:#f1b912;font-weight:bold;color:white',
    'background-color:#f1b912;font-weight:bold;color:#a92727',
    'background-color:#f1b912;color:white;font-weight:bold',
    'color:auto',
    'font-weight:bold;color:#08589d'
  )

  delete window.nostr._requests[message.data.id]
})

// Fix the replacing variable type
let replacing: boolean | null = null;

// Fix the event parameter type
document.addEventListener('mousedown', replaceNostrSchemeLink)
async function replaceNostrSchemeLink(e: MouseEvent) {
  const target = e.target as HTMLAnchorElement;
  if (target.tagName !== 'A' || !target.href.startsWith('nostr:')) return
  
  if (replacing === false) return

  let response = await window.nostr._call(MESSAGE_TYPE.URL_REPLACE, {url: target.href})

  if (response === false) {
    replacing = false
    return
  }

  target.href = response
}
