import browser         from 'webextension-polyfill'
import * as nip19      from 'nostr-tools/nip19'

import { BifrostNode } from '@frostr/bifrost'
import { Mutex }       from 'async-mutex'

import {
  showNotification,
  getPosition
} from './lib/common.js'

import {
  init_node,
  keep_alive
} from './lib/node.js'

import {
  getPermissionStatus,
  updatePermission,
  is_permission_required
} from './lib/permissions.js'

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
  Message,
  ExtensionStore
} from './types.js'

import * as CONST  from './const.js'
import * as crypto from './lib/crypto.js'

let promptMutex                       = new Mutex()
let releasePromptMutex: () => void    = () => {}
let openPrompt: PromptResolver | null = null
let node : BifrostNode | null         = null

browser.runtime.onInstalled.addListener(async (details: browser.Runtime.OnInstalledDetailsType) => {
  if (details.reason === 'install') browser.runtime.openOptionsPage()
  node = await init_node()
})

browser.storage.onChanged.addListener(async (changes: { [key: string]: any }, area: string) => {
  if (area === 'sync') {
    if ('store' in changes) {
      node = await init_node()
    }
  }
})

browser.runtime.onMessage.addListener((
  message : unknown,
  sender  : browser.Runtime.MessageSender
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
  message : unknown,
  sender  : browser.Runtime.MessageSender
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

async function handleContentScriptMessage(msg : ContentScriptMessage) {
  if (is_permission_required(msg.type)) {
    return handlePermissionedRequest(msg)
  } else {
    return handleSafeRequest(msg)
  }
}

async function handleSafeRequest({ type, params } : ContentScriptMessage) {

  switch (type) {

    case 'node_reset':
      node = await init_node()
      return

    case 'get_node_status':
      return { status: node !== null ? 'running' : 'stopped' }
    
    case 'replace_url': {
      let { protocol_handler } = await browser.storage.local.get([
        'protocol_handler'
      ]) as { protocol_handler: string }

      if (!protocol_handler) return false

      let { url }   = params
      let raw       = url.split('nostr:')[1]
      let decoded   = nip19.decode(raw) as Nip19Data
      let nip19Type = decoded.type
      let data      = decoded.data

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

      let result = protocol_handler
      Object.entries(replacements).forEach(([pattern, value]) => {
        if (typeof result === 'string') {
          result = result.replace(new RegExp(`{ *${pattern} *}`, 'g'), value || '')
        }
      })

      return result
    }
  }
}

async function handlePermissionedRequest({ type, params, host } : ContentScriptMessage) {
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
    return {  error: { message: 'denied' } }
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
      const { top, left } = await getPosition(CONST.PROMPT_WIDTH, CONST.PROMPT_HEIGHT)
      // prompt will be resolved with true or false
      let accept = await new Promise<boolean>((resolve, reject) => {
        openPrompt = { resolve, reject }

        browser.windows.create({
          url    : `${browser.runtime.getURL('prompt.html')}?${qs.toString()}`,
          type   : 'popup',
          width  : CONST.PROMPT_WIDTH,
          height : CONST.PROMPT_HEIGHT,
          top    : top,
          left   : left
        })
      })

      // denied, stop here
      if (!accept) return { error: { message: 'denied' } }
    } catch (err: any) {
      // errored, stop here
      releasePromptMutex()
      return { error: { message: err.message, stack: err.stack } }
    }
  }

  const { store } = await browser.storage.sync.get('store') as { store: ExtensionStore }

  if (!store.peers) {
    return { error: { message: 'no peers configured' } }
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
        const pubkey = node.group.group_pk.slice(2)
        const tmpl   = { ...params.event, pubkey }

        try {
          validateEvent(tmpl)
        } catch (error: any) {
          return { error: { message: error.message } }
        }

        const id  = tmpl.id ?? getEventHash(tmpl)
        const res = await node.req.sign(id)

        if (!res.ok) return { error: { message: res.err } }

        return { ...tmpl, id, sig: res.data }
      }
      case 'nip04.encrypt': {
        let { peer, plaintext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_encrypt(secret, plaintext)
      }
      case 'nip04.decrypt': {
        let { peer, ciphertext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip04_decrypt(secret, ciphertext)
      }
      case 'nip44.encrypt': {
        const { peer, plaintext } = params
        const res = await node.req.ecdh(peer)
        if (!res.ok) return { error: { message: res.err } }
        const secret = res.data.slice(2)
        return crypto.nip44_encrypt(plaintext, secret)
      }
      case 'nip44.decrypt': {
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

async function handlePromptMessage (
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
  const { top, left } = await getPosition(CONST.PROMPT_WIDTH, CONST.PROMPT_HEIGHT)

  browser.windows.create({
    url    : `${browser.runtime.getURL('signup.html')}`,
    type   : 'popup',
    width  : CONST.PROMPT_WIDTH,
    height : CONST.PROMPT_HEIGHT,
    top    : top,
    left   : left
  })
}
