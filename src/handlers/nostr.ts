import browser from 'webextension-polyfill'

import {
 keep_alive
} from '../lib/node.js'

import {
  getEventHash,
  validateEvent
} from 'nostr-tools/pure'

import { 
  ContentScriptMessage,
  GlobalState
} from '../types/index.js'

import * as crypto from '../lib/crypto.js'

export async function handleSignerRequest (
  ctx : GlobalState,
  msg : ContentScriptMessage
) {
  const { type, params } = msg

  ctx.node = await keep_alive(ctx.node)

  if (!ctx.node) {
    return { error: { message: 'bifrost node is not initialized' } }
  }

  const pubkey = ctx.node.group.group_pk.slice(2)

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

        const id  = tmpl.id ?? getEventHash(tmpl)
        const res = await ctx.node.req.sign(id)

        if (!res.ok) return { error: { message: res.err } }

        return { ...tmpl, id, sig: res.data }
      }
      case 'nostr.nip04.encrypt': {
        let { peer, plaintext } = params
        const res = await ctx.node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_encrypt(secret, plaintext)
      }
      case 'nostr.nip04.decrypt': {
        let { peer, ciphertext } = params
        const res = await ctx.node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_decrypt(secret, ciphertext)
      }
      case 'nostr.nip44.encrypt': {
        const { peer, plaintext } = params
        const res = await ctx.node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip44_encrypt(plaintext, secret)
      }
      case 'nostr.nip44.decrypt': {
        const { peer, ciphertext } = params
        const res = await ctx.node.req.ecdh(peer)
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
