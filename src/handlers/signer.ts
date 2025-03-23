import { keep_alive } from '@/services/node.js'
import { NodeStore }  from '@/stores/node.js'

import {
  getEventHash,
  validateEvent
} from 'nostr-tools/pure'

import { 
  ContentScriptMessage,
  GlobalState
} from '@/types/index.js'

import * as crypto from '@/lib/cipher.js'

export async function handleSignerRequest (
  ctx : GlobalState,
  msg : ContentScriptMessage
) {
  // Get the store.
  const store = await NodeStore.fetch()
  // Get the request type and parameters.
  const { type, params } = msg
  // Keep the node alive.
  const node = await keep_alive(ctx.node)
  // If the node is not initialized, return an error.
  if (node === null) return { error: { message: 'bifrost node not initialized' } }
  // Get the public key.
  const pubkey = node.group.group_pk.slice(2)
  // Handle the request.
  try {
    switch (type) {
      case 'nostr.getPublicKey': {
        // Return the public key.
        return pubkey
      }
      case 'nostr.getRelays': {
        // Get the relays from the store.
        const relays = store.relays.map(e => e.url)
        // Return the relays.
        return relays
      }
      case 'nostr.signEvent': {
        // Get the event template.
        const tmpl = { ...params.event, pubkey }
        // Validate the event.
        const err = validate_event(tmpl)
        // If the event is invalid, return an error.
        if (err !== null) return { error: { message: err } }
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
        // Get the peer and plaintext.
        let { peer, plaintext } = params
        // Get the shared secret.
        const res = await node.req.ecdh(peer)
        // If the shared secret is not ok, return an error.
        if (!res.ok) return { error: { message: res.err } }
        // Get the secret.
        const secret = res.data.slice(2)
        // Return the encrypted plaintext.
        return crypto.nip04_encrypt(secret, plaintext)
      }
      case 'nostr.nip04.decrypt': {
        // Get the peer and ciphertext.
        const { peer, ciphertext } = params
        // Get the shared secret.
        const res = await node.req.ecdh(peer)
        // If the shared secret is not ok, return an error.
        if (!res.ok) return { error: { message: res.err } }
        // Get the secret.
        const secret = res.data.slice(2)
        // Return the decrypted ciphertext.
        return crypto.nip04_decrypt(secret, ciphertext)
      }
      case 'nostr.nip44.encrypt': {
        // Get the peer and plaintext.
        const { peer, plaintext } = params
        // Get the shared secret.
        const res = await node.req.ecdh(peer)
        // If the shared secret is not ok, return an error.
        if (!res.ok) return { error: { message: res.err } }
        // Get the secret.
        const secret = res.data.slice(2)
        // Return the encrypted plaintext.
        return crypto.nip44_encrypt(plaintext, secret)
      }
      case 'nostr.nip44.decrypt': {
        // Get the peer and ciphertext.
        const { peer, ciphertext } = params
        // Get the shared secret.
        const res = await node.req.ecdh(peer)
        // If the shared secret is not ok, return an error.
        if (!res.ok) return { error: { message: res.err } }
        // Get the secret.
        const secret = res.data.slice(2)
        // Return the decrypted ciphertext.
        return crypto.nip44_decrypt(ciphertext, secret)
      }
    }
  } catch (error: any) {
    console.error('error handling signer request:', error)
    return { error: { message: error.message } }
  }
}

function validate_event (event: any) {
  try {
    validateEvent(event)
    return null
  } catch {
    return 'event failed validation'
  }
}
