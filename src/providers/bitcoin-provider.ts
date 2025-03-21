import { MESSAGE_TYPE } from '../const.js';

import type {
  WalletUtxo,
  WalletSignMainifest
} from '../types/index.js'

// First declare the window btc property type
declare global {
  interface Window {
    bitcoin: {
      _requests: Record<string, { resolve: (value: any) => void, reject: (error: Error) => void }>;
      _account: string | null;
      getAccount(): Promise<string>;
      getBalance(): Promise<number>;
      getUtxos(amount: number): Promise<WalletUtxo[]>;
      signPsbt(psbt: string, manifest: WalletSignMainifest): Promise<string>;
      _call(type: string, params: Record<string, any>): Promise<any>;
    }
  }
}

window.bitcoin = {
  _requests : {},
  _account  : null,

  async getAccount() {
    if (this._account === null) {
      const res = await this._call(MESSAGE_TYPE.GET_ACCOUNT, {}) as { account: string }
      if (typeof res.account !== 'string') {
        throw new Error('Failed to get wallet account')
      } else {
        this._account = res.account
      }
    }
    return this._account
  },

  async getBalance() {
    return window.bitcoin._call(MESSAGE_TYPE.GET_BALANCE, {})
  },

  async getUtxos(amount: number) {
    return window.bitcoin._call(MESSAGE_TYPE.GET_UTXOS, { amount })
  },

  async signPsbt(psbt: string, manifest: WalletSignMainifest) {
    return window.bitcoin._call(MESSAGE_TYPE.SIGN_PSBT, { psbt, manifest })
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
    !window.bitcoin._requests[message.data.id]
  )
    return

  if (message.data.response.error) {
    let error = new Error('frost2x: ' + message.data.response.error.message)
    error.stack = message.data.response.error.stack
    window.bitcoin._requests[message.data.id].reject(error)
  } else {
    window.bitcoin._requests[message.data.id].resolve(message.data.response)
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

  delete window.bitcoin._requests[message.data.id]
})

// Fix the replacing variable type
let replacing: boolean | null = null;

// Fix the event parameter type
document.addEventListener('mousedown', replaceNostrSchemeLink)
async function replaceNostrSchemeLink(e: MouseEvent) {
  const target = e.target as HTMLAnchorElement;
  if (target.tagName !== 'A' || !target.href.startsWith('psbt:')) return
  
  if (replacing === false) return

  let response = await window.bitcoin._call(MESSAGE_TYPE.URL_REPLACE, {url: target.href})

  if (response === false) {
    replacing = false
    return
  }

  target.href = response
}
