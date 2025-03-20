import browser from 'webextension-polyfill'

import { BifrostNode } from '@frostr/bifrost' 
import { keep_alive }  from '../services/node.js'

import {
  getEventHash,
  validateEvent
} from 'nostr-tools/pure'

import { 
  ContentScriptMessage,
  GlobalState,
  SignRequest
} from '../types/index.js'

import * as crypto from '../lib/cipher.js'

const BATCH_INTERVAL = 50

// Batch queue and timer
let queue : SignRequest[] = [],
    timer : NodeJS.Timeout | null = null

// Process the batch of sign requests
async function process_batch (node : BifrostNode) {
  // Get the current batch from the queue.
  const batch = [ ...queue ]
  // Clear the timer and queue.
  queue = []; timer = null
  // If there are no requests, return.
  if (batch.length === 0) return

  console.log('[ handler/nostr ] batch signing event ids:', batch.map(req => req.id))
  
  try {
    // Collect all IDs to be signed
    const ids = batch.map(req => [ req.id ])
    // Send all IDs to be signed in one request
    const res = await node.req.sign(ids)
    // If the batch failed, reject all requests.
    if (!res.ok) {
      batch.forEach(req => req.reject({ error: { message: res.err } }))
      return
    }
    // Resolve each request with the signature.
    batch.forEach(req => {
      // Get the signature for the request.
      const sig = res.data.find(([ id ]) => id === req.id)?.at(1)
      // If there's a signature,
      if (sig !== undefined) {
        // Resolve the request with the signature.
        req.resolve({ ...req.tmpl, id: req.id, sig })
      } else {
        // If there's no signature, reject the request.
        req.reject({ error: { message: 'no signature found' } })
      }
    })
  } catch (err: any) {
    // If there's an error, reject all requests.
    batch.forEach(req => req.reject({ error: { message: err.message } }))
  }
}

// Start the batch timer if it's not already running
function schedule_batch (node : BifrostNode) {
  if (timer === null) {
    timer = setTimeout(() => process_batch(node), BATCH_INTERVAL)
  }
}

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
        const id = tmpl.id ?? getEventHash(tmpl)
        // Return a promise that will be resolved when the batch is processed.
        return new Promise((resolve, reject) => {
          // Add the request to the queue
          queue.push({ tmpl, id, resolve, reject })
          // Schedule batch processing if not already scheduled.
          schedule_batch(node)
        })
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
