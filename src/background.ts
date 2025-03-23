import browser                    from 'webextension-polyfill'
import { Mutex }                  from 'async-mutex'
import { is_permission_required } from '@/lib/perms.js'
import { init_node }              from '@/services/node.js'
import { SettingStore }           from '@/stores/settings.js'

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
  GlobalState,
  GlobalMessage
} from './types/index.js'

import * as CONST  from './const.js'

let global : GlobalState = {
  mutex  : { lock : new Mutex(), release : () => {} },
  prompt : null,
  node   : null
}

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
    // If the response is not null, return it.
    if (res !== null) return { error: res }
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
    console.log('handlePromptMessage message:', message)
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
) : Promise<Record<string, string> | null> {
  // Parse the incoming message.
  console.log('handlePermissionRequest message:', message)
  const msg = parse_content_message(message)
  // If the message is null, return an error.
  if (msg === null) {
    return { message: 'invalid prompt message' }
  }
  // Unpack the message details.
  const { host, type, params } = msg
  // Get the extension store.
  const store = await SettingStore.fetch()
  // Get the notification setting from the store.
  let show_notice = store.general.notifications
  // Acquire a lock on the mutex.
  global.mutex.release = await global.mutex.lock.acquire()
  // Get the permission status for the request.
  let allowed = await getPermissionStatus(host, type, params)
  console.log('handlePermissionRequest allowed:', allowed)
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
      return { message: err.message }
    }
  }

  // If the permission has a response.
  if (allowed !== null) {
    // Release the mutex.
    global.mutex.release()
    // If the notification setting is enabled, show a notification.
    if (show_notice) showNotification(host, allowed, type, params)
  }

  // Handle the permission response.
  if (allowed === true)  return null
  if (allowed === false) return { message: 'denied' }
  return { message: 'failed to get permission' }
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
  return { ...msg, host, type }
}
