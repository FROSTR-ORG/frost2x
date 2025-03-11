import { MESSAGE_TYPE }        from '../const.js'
import { fetchExtensionStore } from '../stores/extension.js'

import {
  filter_utxos,
  get_utxo_balance,
  select_utxos
} from '../lib/wallet.js'

import type { ContentScriptMessage } from '../types/index.js'

export async function handleWalletRequest (
  msg : ContentScriptMessage
) {
  const { params, type } = msg

  const store = await fetchExtensionStore()
  const utxos = filter_utxos(store.wallet.utxo_set)
  
  try {
    switch (type) {
      case MESSAGE_TYPE.GET_ACCOUNT: {
        return { account: store.wallet.address }
      }
      case MESSAGE_TYPE.GET_BALANCE: {
        const balance = get_utxo_balance(utxos)
        return { sats: balance }
      }
      case MESSAGE_TYPE.GET_UTXOS: {
        // Parse the amount in the request, if any.
        const amount = parse_utxo_amount(params.amount)
        // If the amount is invalid,
        if (amount === null) {
          // Return an error.
          return { error: { message: `invalid amount: ${params.amount}` } }
        }
        // If the amount is provided,
        if (amount !== undefined) {
          // Select the funding utxos.
          const ret = select_utxos(utxos, amount)
          // If the selection failed,
          if (!ret.ok) {
            // Return an error.
            return { error: { message: ret.err } }
          } else {
            // Return the selected utxos.
            return { utxos: ret.value }
          }
        } else {
          // Return all utxos.
          return { utxos }
        }
      }
      case MESSAGE_TYPE.SIGN_PSBT: {
        return { error: { message: 'not implemented' } }
      }
    }
  } catch (error: any) {
    console.error('background error:', error)
    return { error: { message: error.message, stack: error.stack } }
  }
}

function parse_utxo_amount (value: any) {
  if (typeof value === 'number')    return value
  if (typeof value === 'undefined') return undefined
  return null
}
