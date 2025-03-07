import browser         from 'webextension-polyfill'
import * as nip19      from 'nostr-tools/nip19'

import { BifrostNode }  from '@frostr/bifrost'
import { Mutex }        from 'async-mutex'
import { FrostrWallet } from './lib/wallet.js'

import {
  handleSignerRequest,
  handleNodeRequest,
  // handleLinkRequest,
  // handleWalletRequest
} from './handlers/index.js'

import {
  getPosition,
  showNotification
} from './lib/browser.js'

import {
  get_signer_permission,
  update_signer_permission,
} from './permissions/index.js'

import { 
  ContentScriptMessage,
  Message,
  ExtensionStore
} from './types/index.js'

import * as CONST  from './const.js'

let promptMutex                        = new Mutex()
let releasePromptMutex: () => void     = () => {}
let openPrompt : PromptResolver | null = null
let node       : BifrostNode    | null = null

// Initialize the extension on load.
init_extension()

// Handle extension installation event.
browser.runtime.onInstalled.addListener(async (details: browser.Runtime.OnInstalledDetailsType) => {
  // Open the options page if the extension is installed.
  if (details.reason === 'install') browser.runtime.openOptionsPage()
  // Initialize the extension.
  init_extension()
})

/**
 * Handle messages from the browser's runtime.
 */
browser.runtime.onMessage.addListener((
  message : unknown,
  sender  : browser.Runtime.MessageSender
) => {
  const msg = message as GlobalMessage

  // If the prompt flag is undefined
  if (msg.prompt === undefined) {
    // Handle the message as a content script message.
    return handleContentScriptMessage(msg as ContentScriptMessage)
  }
  // Handle the message as a prompt message.
  handlePromptMessage(msg, sender)
  // Return true to handle the message asynchronously.
  return true
})

/**
 * Handle messages from external sources.
 */
browser.runtime.onMessageExternal.addListener(async (
  message : unknown,
  sender  : browser.Runtime.MessageSender
) => {
  const { type, params } = message as { type: string; params: any }
  let extensionId = new URL(sender.url!).host
  return handleContentScriptMessage({ type, params, host: extensionId })
})

/**
 * Handle window removal event.
 */
browser.windows.onRemoved.addListener((_: number) => {
  // If the prompt is not null,
  if (global.prompt !== null) {
    // Clear the prompt message.
    handlePromptMessage({ accept: false }, null)
  }
})

// Initialize the extension.
async function init_extension() {
  console.log('Initializing extension')
  global.node  = await init_node()
}

async function handleContentScriptMessage(msg : ContentScriptMessage) {
  // Get the domain of the request.
  const domain = msg.type?.split('.').at(0)
  // If the request does not require permission,
  if (!is_permission_required(msg.type)) {
    switch (domain) {
      case 'node':
        // Handle requests to manage the node.
        return handleNodeRequest(global, msg)
      // case 'link':
        // Handle requests to resolve links.
        // return handleLinkRequest(msg)
    }
  } else {
    // Get the permission response.
    const res = await handlePermissionRequest(msg)
    console.log('permission response:', res)
    // If the response is not null, return it.
    if (res !== null) return { error: { message: res } }
    // Handle the permissioned request.
    switch (domain) { 
      case 'nostr':
        return handleSignerRequest(global, msg)
      // case 'wallet':
      //   return handleWalletRequest(global, msg)
    }
  }
}

async function handlePromptMessage (
  message : GlobalMessage,
  sender  : browser.Runtime.MessageSender | null
) {
  try {
    const msg = parse_prompt_message(message)
    if (msg === null) throw new Error('received prompt response with null message')
    const { host, type, accept, conditions } = msg
    // Return the response to the prompt.
    global.prompt?.resolve?.(accept!)
    // If the domain is undefined, return.
    if (conditions !== undefined) {
      // Update the permission status.
      const domain = type.split('.').at(0)
      switch (domain) { 
        case 'nostr':
          await update_signer_permission(host, type, accept, conditions)
          break
        default:
          throw new Error(`received prompt response from unknown domain: ${domain}`)
      }
    }
  } catch (err: any) {
    console.error('failed to handle prompt message')
    console.error(err)
  } finally {
    // Cleanup the prompt resolver.
    global.prompt = null
    // Release the mutex after updating policies.
    global.mutex.release()
    // close prompt
    if (sender?.tab?.windowId) {
      browser.windows.remove(sender.tab.windowId)
    }
  }
}

export async function handlePermissionRequest (
  message : ContentScriptMessage
) : Promise<string | null> {
  // Parse the incoming message.
  const msg = parse_content_message(message)
  // If the message is null, return an error.
  if (msg === null) return 'invalid prompt message'
  // Unpack the message details.: a: anyny
  const { host, type, params } = msg
  // Get the extension store.
  const store = await SettingStore.fetch()
  // Get the notification setting from the store.
  let show_notice = store.general.notifications
  // Acquire a lock on the mutex.
  global.mutex.release = await global.mutex.lock.acquire()
  // Get the permission status for the request.
  let allowed = await getPermissionStatus(host, type, params)

  console.log('permission status:', { host, type, allowed })

  if (allowed === null) {
    try {
      // Disable notifications.
      show_notice = false
      // Create a URL search params object.
      let qs = new URLSearchParams({
        host   : host,
        id     : Math.random().toString().slice(4),
        type   : type,
        params : JSON.stringify(params ?? {})
      })
      // Get the position of the prompt.
      const { top, left } = await getPosition(CONST.PROMPT_WIDTH, CONST.PROMPT_HEIGHT)
      // Get a promise that resolves to the user's response.
      allowed = await new Promise<boolean>((resolve, reject) => {
        // Set the prompt resolver.
        global.prompt = { resolve, reject }
        // Create the prompt window.
        browser.windows.create({
          url    : `${browser.runtime.getURL('prompt.html')}?${qs.toString()}`,
          type   : 'popup',
          width  : CONST.PROMPT_WIDTH,
          height : CONST.PROMPT_HEIGHT,
          top    : top,
          left   : left
        })
      })
    } catch (err: any) {
      global.mutex.release()
      // Return an error.
      console.log('error handling permission request:', err)
      return err.message
    }
  }

  const { store } = await browser.storage.sync.get('store') as { store: ExtensionStore }

  if (!store.node.peers) {
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
      case 'wallet.getAddress': {
        return node.group.group_pk.slice(2)
      }
      case 'wallet.getBalance': {
        return node.group.group_pk.slice(2)
      }
      case 'wallet.getUtxos': {
        return node.group.group_pk.slice(2)
      }
      case 'wallet.signPsbt': {
        return node.group.group_pk.slice(2)
      }
    }
  } catch (error: any) {
    console.error('background error:', error)
    return { error: { message: error.message, stack: error.stack } }
  }
}

function parse_content_message (
  msg : ContentScriptMessage
) {
  const { type, host } = msg
  if (host === undefined || type === undefined) {
    return null
  }
  return { ...msg, host, type }
}

function parse_prompt_message (
  msg : GlobalMessage
) {
  const { host, type, accept } = msg
  if (host === undefined || type === undefined || accept === undefined) {
    return null
  }
  return { ...msg, host, type, accept }
}

async function getPermissionStatus (
  host   : string,
  type   : string,
  params : any
) : Promise<boolean | null> {
  const domain = type.split('.').at(0)
  switch (domain) {
    case 'nostr':
      return get_signer_permission(host, type, params)
    default:
      throw new Error(`unknown permission domain: ${domain}`)
  }
}
