import { fetchExtensionStore } from '../stores/extension.js'

import type { ContentScriptMessage } from '../types/index.js'

export async function handleWalletRequest (
  msg : ContentScriptMessage
) {
  const { type } = msg

  const store = await fetchExtensionStore()
  
  try {
    switch (type) {
      case 'wallet.getAccount': {
        return { account: store.wallet.address }
      }
      case 'wallet.getBalance': {
        return { error: { message: 'not implemented' } }
      }
      case 'wallet.getUtxos': {
        const utxos    = store.wallet.utxo_set.filter(utxo => utxo.selected && utxo.confirmed)
        const selected = utxos.filter(utxo => utxo.selected)
        return { utxos: selected }
      }
      case 'wallet.signPsbt': {
        return { error: { message: 'not implemented' } }
      }
    }
  } catch (error: any) {
    console.error('background error:', error)
    return { error: { message: error.message, stack: error.stack } }
  }
}
