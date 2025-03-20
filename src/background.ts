import browser       from 'webextension-polyfill'
import { Mutex }     from 'async-mutex'
import { init_node } from './services/node.js'

import {
  fetchExtensionStore,
  onExtensionStoreUpdate
} from './stores/extension.js'

import {
  handleSignerRequest,
  handleNodeRequest,
  handleLinkRequest,
  handleWalletRequest
} from './handlers/index.js'

import {
  getPosition,
  showNotification
} from './lib/browser.js'

import {
  is_permission_required,
  getSignerPermissionStatus,
  updateSignerPermission,
  getWalletPermissionStatus,
  updateWalletPermission
} from './permissions/index.js'

import { 
  ContentScriptMessage,
  ExtensionStore,
  GlobalState,
  Message
} from './types/index.js'

import * as CONST  from './const.js'

let global : GlobalState = {
  mutex  : { lock : new Mutex(), release : () => {} },
  prompt : null,
  node   : null
}

initializeExtension()

/**
 * Handle extension installation event.
 */
browser.runtime.onInstalled.addListener(async (details: browser.Runtime.OnInstalledDetailsType) => {
  // Open the options page if the extension is installed.
  if (details.reason === 'install') browser.runtime.openOptionsPage()
  // Initialize the extension.
  await initializeExtension()
})

/**
 * Handle messages from browser runtime.
 */
browser.runtime.onMessage.addListener((
  message : unknown,
  sender  : browser.Runtime.MessageSender
) => {
  const msg = message as Message

  if (msg.prompt) {
    handlePromptMessage(msg, sender)
  } else {
    return handleContentScriptMessage(msg as ContentScriptMessage)
  }

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
  if (global.prompt) {
    // calling this with a simple "no" response will not store anything, so it's fine
    // it will just return a failure
    handlePromptMessage({ accept: false }, null)
  }
})

// In your background script
async function initializeExtension() {
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
      case 'link':
        // Handle requests to resolve links.
        return handleLinkRequest(msg)
    }
  } else {
    // Get the permission response.
    const res = await handlePermissionRequest(msg)
    // If the response is not null, return it.
    if (res !== null) return res
    // Handle the permissioned request.
    switch (domain) { 
      case 'nostr':
        return handleSignerRequest(global, msg)
      case 'wallet':
        return handleWalletRequest(msg)
    }
  }
}

async function handlePromptMessage (
  { host, type, accept, conditions }: Message,
  sender: browser.Runtime.MessageSender | null
) {
  // Get the extension store.
  const store = await fetchExtensionStore()
  // Return the response to the prompt.
  global.prompt?.resolve?.(accept!)
  // Get the domain of the request.
  const domain = type?.split('.').at(0)

  // Update the permission status.
  switch (domain) { 
    case 'nostr':
      await updateSignerPermission(host!, type!, accept!, conditions!)
      break
    case 'wallet':
      updateWalletPermission(store,host!, type!, accept!)
      break
  }

  // Cleanup the prompt resolver.
  global.prompt = null

  // Release the mutex after updating policies.
  global.mutex.release()

  // close prompt
  if (sender?.tab?.windowId) {
    browser.windows.remove(sender.tab.windowId)
  }
}

export async function handlePermissionRequest (
  msg : ContentScriptMessage
) : Promise<Record<string, string> | null> {
  // Unpack message details.
  const { host, type, params } = msg
  // Get the extension store.
  const store = await fetchExtensionStore()

  // Get the notification setting from the store.
  let show_notice = store.settings['general/notifications']

  // Acquire a lock on the mutex.
  global.mutex.release = await global.mutex.lock.acquire()

  // Get the permission status for the request.
  let allowed : boolean | null = await getPermission(store, host!, type, params)

  if (allowed === null) {
    try {
      // Disable notifications.
      show_notice = false
      // Create a URL search params object.
      let qs = new URLSearchParams({
        host   : host!,
        id     : Math.random().toString().slice(4),
        params : JSON.stringify(params),
        type
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
      // Release the mutex.
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
    if (show_notice) showNotification(host!, allowed, type, params)
  }

  // Handle the permission response.
  if (allowed === true)  return null
  if (allowed === false) return { message: 'denied' }
  return { message: 'failed to get permission' }
}

async function getPermission (
  store : ExtensionStore,
  host  : string,
  type  : string,
  params: any
) : Promise<boolean | null> {
  const domain = type.split('.').at(0)

  switch (domain) {
    case 'nostr':
      return getSignerPermissionStatus(host, type, params)
    case 'wallet':
      return getWalletPermissionStatus(store, host, type)
    default:
      return null
  }
}
