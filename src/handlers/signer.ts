import browser from 'webextension-polyfill'

import { keep_alive }  from '../services/node.js'

import {
  getEventHash,
  validateEvent
} from 'nostr-tools/pure'

import { 
  ContentScriptMessage,
  GlobalState
} from '../types/index.js'

import * as crypto from '../lib/cipher.js'

export async function handleSignerRequest (
  ctx : GlobalState,
  msg : ContentScriptMessage
) {
  // Get the request type and parameters.
  const { type, params } = msg
  // Keep the node alive.
  const node = await keep_alive(ctx.node)
  // If the node is not initialized, return an error.
  if (node === null) {
    return { error: { message: 'bifrost node is not initialized' } }
  }
  // Get the public key.
  const pubkey = node.group.group_pk.slice(2)
  // Handle the request.
  try {
    switch (type) {
      case 'nostr.getPublicKey': {
        return pubkey
      }
      case 'nostr.getRelays': {
        let results = await browser.storage.local.get('relays')
        return results.relays || {}
      }
      case 'nostr.signEvent': {
        const tmpl = { ...params.event, pubkey }

        try {
          validateEvent(tmpl)
        } catch (error: any) {
          return { error: { message: error.message } }
        }
        // Get the event ID.
        const id  = tmpl.id ?? getEventHash(tmpl)
        // Queue the event signing.
        const res = await node.req.queue(id)
        // Get the signature.
        const sig = res.at(2)
        // Return the signed event.
        return { ...tmpl, id, sig }
      }
      case 'nostr.nip04.encrypt': {
        let { peer, plaintext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_encrypt(secret, plaintext)
      }
      case 'nostr.nip04.decrypt': {
        let { peer, ciphertext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_decrypt(secret, ciphertext)
      }
      case 'nostr.nip44.encrypt': {
        const { peer, plaintext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip44_encrypt(plaintext, secret)
      }
      case 'nostr.nip44.decrypt': {
        const { peer, ciphertext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip44_decrypt(ciphertext, secret)
      }
    }
  } catch (error: any) {
    console.error('background error:', error)
    return { error: { message: error.message, stack: error.stack } }
  }
}
