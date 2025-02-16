import browser         from 'webextension-polyfill'
import * as nip19      from 'nostr-tools/nip19'

import { Buff }        from '@cmdcode/buff'
import { BifrostNode } from '@frostr/bifrost'
import { Mutex }       from 'async-mutex'

import {
  init_node,
  keep_alive
} from './lib/node.js'

import {
  getEventHash,
  validateEvent
} from 'nostr-tools/pure'

import { 
  PromptResolver,
  ProfilePointer,
  EventPointer,
  Nip19Data,
  ContentScriptMessage,
  Message
} from './types.js'

import {
  NO_PERMISSIONS_REQUIRED,
  getPermissionStatus,
  updatePermission,
  showNotification,
  getPosition
} from './common.js'

import * as crypto from './lib/crypto.js'

let promptMutex = new Mutex()
let openPrompt: PromptResolver | null = null
let releasePromptMutex: () => void    = () => {}

//set the width and height of the prompt window
const width  = 340
const height = 360

let node : BifrostNode | null = null

browser.runtime.onInstalled.addListener(async (details: browser.Runtime.OnInstalledDetailsType) => {
  if (details.reason === 'install') browser.runtime.openOptionsPage()
  node = await init_node()
})

browser.storage.onChanged.addListener(async (changes: { [key: string]: any }, area: string) => {
  if (area === 'sync') {
    if ('relays' in changes || 'store' in changes) {
      node = await init_node()
    }
  }
})

browser.runtime.onMessage.addListener((
  message      : unknown,
  sender       : browser.Runtime.MessageSender,
  sendResponse : (response?: any) => void
) => {
  const msg = message as Message
  if (msg.openSignUp) {
    openSignUpWindow()
    if (sender.tab?.windowId) {
      browser.windows.remove(sender.tab.windowId)
    }
  } else {
    if (msg.prompt) {
      handlePromptMessage(msg, sender)
    } else {
      return handleContentScriptMessage(msg as ContentScriptMessage)
    }
  }
  return true
})

browser.runtime.onMessageExternal.addListener(async (
  message: unknown,
  sender: browser.Runtime.MessageSender,
  sendResponse: (response?: any) => void
) => {
  const { type, params } = message as { type: string; params: any }
  let extensionId = new URL(sender.url!).host
  return handleContentScriptMessage({ type, params, host: extensionId })
})

browser.windows.onRemoved.addListener((_: number) => {
  if (openPrompt) {
    // calling this with a simple "no" response will not store anything, so it's fine
    // it will just return a failure
    handlePromptMessage({ accept: false }, null)
  }
})

async function handleContentScriptMessage({ type, params, host }: ContentScriptMessage) {
  if (type in NO_PERMISSIONS_REQUIRED && NO_PERMISSIONS_REQUIRED[type as keyof typeof NO_PERMISSIONS_REQUIRED]) {
    // authorized, and we won't do anything with private key here, so do a separate handler
    switch (type) {
      case 'replaceURL': {
        let { protocol_handler: ph } = await browser.storage.local.get([
          'protocol_handler'
        ]) as { protocol_handler: string }
        if (!ph) return false

        let { url } = params
        let raw = url.split('nostr:')[1]
        let decoded = nip19.decode(raw) as Nip19Data
        let nip19Type = decoded.type
        let data = decoded.data

        const typeMap = {
          npub     : { p_or_e: 'p', u_or_n: 'u' },
          note     : { p_or_e: 'e', u_or_n: 'n' },
          nprofile : { p_or_e: 'p', u_or_n: 'u' },
          nevent   : { p_or_e: 'e', u_or_n: 'n' },
          naddr    : { p_or_e: 'p', u_or_n: 'u' },
          nsec     : { p_or_e: 'p', u_or_n: 'u' }
        } as const

        const replacements = {
          raw,
          hrp: nip19Type,
          hex: (() => {
            if (nip19Type === 'npub' || nip19Type === 'note') return data as string
            if (nip19Type === 'nprofile') return (data as ProfilePointer).pubkey
            if (nip19Type === 'nevent') return (data as EventPointer).id
            return null
          })(),
          p_or_e: typeMap[nip19Type as keyof typeof typeMap]?.p_or_e ?? null,
          u_or_n: typeMap[nip19Type as keyof typeof typeMap]?.u_or_n ?? null,
          relay0: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[0] ?? null : null,
          relay1: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[1] ?? null : null,
          relay2: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[2] ?? null : null
        }

        let result = ph
        Object.entries(replacements).forEach(([pattern, value]) => {
          if (typeof result === 'string') {
            result = result.replace(new RegExp(`{ *${pattern} *}`, 'g'), value || '')
          }
        })

        return result
      }
    }

    return
  } else {
    // acquire mutex here before reading policies
    releasePromptMutex = await promptMutex.acquire()

    let allowed = await getPermissionStatus(
      host!,
      type,
      type === 'signEvent' ? params.event : undefined
    )

    if (allowed === true) {
      // authorized, proceed
      releasePromptMutex()
      showNotification(host!, allowed, type, params)
    } else if (allowed === false) {
      // denied, just refuse immediately
      releasePromptMutex()
      showNotification(host!, allowed, type, params)
      return {
        error: { message: 'denied' }
      }
    } else {
      // ask for authorization
      try {
        let id = Math.random().toString().slice(4)
        let qs = new URLSearchParams({
          host: host!,
          id,
          params: JSON.stringify(params),
          type
        })
        // center prompt
        const { top, left } = await getPosition(width, height)
        // prompt will be resolved with true or false
        let accept = await new Promise<boolean>((resolve, reject) => {
          openPrompt = { resolve, reject }

          browser.windows.create({
            url: `${browser.runtime.getURL('prompt.html')}?${qs.toString()}`,
            type: 'popup',
            width: width,
            height: height,
            top: top,
            left: left
          })
        })

        // denied, stop here
        if (!accept) return { error: { message: 'denied' } }
      } catch (err: any) {
        // errored, stop here
        releasePromptMutex()
        return {
          error: { message: err.message, stack: err.stack }
        }
      }
    }
  }

  // if we're here this means it was accepted
  interface Store {
    server: string
  }

  const { store } = await browser.storage.sync.get('store') as { store: Store }

  if (store.server === undefined) {
    return { error: { message: 'no host server configured' } }
  }

  node = await keep_alive(node)

  if (!node) {
    return { error: { message: 'bifrost node is not initialized' } }
  }

  try {
    switch (type) {
      case 'getPublicKey': {
        return node.group.group_pk.slice(2)
      }
      case 'getRelays': {
        let results = await browser.storage.local.get('relays')
        return results.relays || {}
      }
      case 'signEvent': {

        console.log('params:', params)
        const pubkey = node.group.group_pk.slice(2)
        const tmpl   = { ...params.event, pubkey }

        try {
          validateEvent(tmpl)
          console.log('event template:', tmpl)
        } catch (error: any) {
          return { error: { message: error.message } }
        }

        const id     = tmpl.id ?? getEventHash(tmpl)
        const res    = await node.req.sign(id, [ store.server ])
        if (!res.ok) return { error: { message: res.err } }

        const event = { ...tmpl, id, sig: res.data }
        console.log('event:', event)
        return event
      }
      case 'nip04.encrypt': {
        let { peer, plaintext } = params
        const res = await node.req.ecdh([ store.server ], peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_encrypt(secret, plaintext)
      }
      case 'nip04.decrypt': {
        let { peer, ciphertext } = params
        const res = await node.req.ecdh([ store.server ], peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_decrypt(secret, ciphertext)
      }
      case 'nip44.encrypt': {
        const { peer, plaintext } = params
        const res = await node.req.ecdh([ store.server ], peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip44_encrypt(plaintext, secret)
      }
      case 'nip44.decrypt': {
        const { peer, ciphertext } = params
        const res = await node.req.ecdh([ store.server ], peer)
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

async function handlePromptMessage(
  { host, type, accept, conditions }: Message,
  sender: browser.Runtime.MessageSender | null
) {
  // return response
  openPrompt?.resolve?.(accept!)

  // update policies
  if (conditions) {
    await updatePermission(host!, type!, accept!, conditions)
  }

  // cleanup this
  openPrompt = null

  // release mutex here after updating policies
  releasePromptMutex()

  // close prompt
  if (sender?.tab?.windowId) {
    browser.windows.remove(sender.tab.windowId)
  }
}

async function openSignUpWindow(): Promise<void> {
  const { top, left } = await getPosition(width, height)

  browser.windows.create({
    url: `${browser.runtime.getURL('signup.html')}`,
    type: 'popup',
    width: width,
    height: height,
    top: top,
    left: left
  })
}
