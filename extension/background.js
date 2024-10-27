import browser from 'webextension-polyfill'
import {validateEvent, getEventHash} from 'nostr-tools/pure'
import * as nip19 from 'nostr-tools/nip19'
// import * as nip04 from 'nostr-tools/nip04'
// import * as nip44 from 'nostr-tools/nip44'
import {Mutex} from 'async-mutex'
// import {LRUCache} from './utils'

import {
  NO_PERMISSIONS_REQUIRED,
  getPermissionStatus,
  updatePermission,
  showNotification,
  getPosition
} from './common'

import {
  combine_partial_sigs,
  create_psig_pkg,
  decode_group_pkg,
  decode_secret_pkg,
  get_session_ctx,
  verify_psig_pkg
} from '@cmdcode/bifrost/lib'

let openPrompt = null
let promptMutex = new Mutex()
let releasePromptMutex = () => {}
// let secretsCache = new LRUCache(100)
// let previousSk = null

// function getSharedSecret(sk, peer) {
//   // Detect a key change and erase the cache if they changed their key
//   if (previousSk !== sk) {
//     secretsCache.clear()
//   }

//   let key = secretsCache.get(peer)

//   if (!key) {
//     key = nip44.v2.utils.getConversationKey(sk, peer)
//     secretsCache.set(peer, key)
//   }

//   return key
// }

//set the width and height of the prompt window
const width = 340
const height = 360

browser.runtime.onInstalled.addListener((_, __, reason) => {
  if (reason === 'install') browser.runtime.openOptionsPage()
})

browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.openSignUp) {
    openSignUpWindow()
    browser.windows.remove(sender.tab.windowId)
  } else {
    let {prompt} = message
    if (prompt) {
      handlePromptMessage(message, sender)
    } else {
      return handleContentScriptMessage(message)
    }
  }
})

browser.runtime.onMessageExternal.addListener(
  async ({type, params}, sender) => {
    let extensionId = new URL(sender.url).host
    return handleContentScriptMessage({type, params, host: extensionId})
  }
)

browser.windows.onRemoved.addListener(_ => {
  if (openPrompt) {
    // calling this with a simple "no" response will not store anything, so it's fine
    // it will just return a failure
    handlePromptMessage({accept: false}, null)
  }
})

async function handleContentScriptMessage({type, params, host}) {
  if (NO_PERMISSIONS_REQUIRED[type]) {
    // authorized, and we won't do anything with private key here, so do a separate handler
    switch (type) {
      case 'replaceURL': {
        let {protocol_handler: ph} = await browser.storage.local.get([
          'protocol_handler'
        ])
        if (!ph) return false

        let {url} = params
        let raw = url.split('nostr:')[1]
        let {type, data} = nip19.decode(raw)
        let replacements = {
          raw,
          hrp: type,
          hex:
            type === 'npub' || type === 'note'
              ? data
              : type === 'nprofile'
              ? data.pubkey
              : type === 'nevent'
              ? data.id
              : null,
          p_or_e: {npub: 'p', note: 'e', nprofile: 'p', nevent: 'e'}[type],
          u_or_n: {npub: 'u', note: 'n', nprofile: 'u', nevent: 'n'}[type],
          relay0: type === 'nprofile' ? data.relays[0] : null,
          relay1: type === 'nprofile' ? data.relays[1] : null,
          relay2: type === 'nprofile' ? data.relays[2] : null
        }
        let result = ph
        Object.entries(replacements).forEach(([pattern, value]) => {
          result = result.replace(new RegExp(`{ *${pattern} *}`, 'g'), value)
        })

        return result
      }
    }

    return
  } else {
    // acquire mutex here before reading policies
    releasePromptMutex = await promptMutex.acquire()

    let allowed = await getPermissionStatus(
      host,
      type,
      type === 'signEvent' ? params.event : undefined
    )

    if (allowed === true) {
      // authorized, proceed
      releasePromptMutex()
      showNotification(host, allowed, type, params)
    } else if (allowed === false) {
      // denied, just refuse immediately
      releasePromptMutex()
      showNotification(host, allowed, type, params)
      return {
        error: {message: 'denied'}
      }
    } else {
      // ask for authorization
      try {
        let id = Math.random().toString().slice(4)
        let qs = new URLSearchParams({
          host,
          id,
          params: JSON.stringify(params),
          type
        })
        // center prompt
        const {top, left} = await getPosition(width, height)
        // prompt will be resolved with true or false
        let accept = await new Promise((resolve, reject) => {
          openPrompt = {resolve, reject}

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
        if (!accept) return {error: {message: 'denied'}}
      } catch (err) {
        // errored, stop here
        releasePromptMutex()
        return {
          error: { message: err.message, stack: err.stack }
        }
      }
    }
  }

  // if we're here this means it was accepted
  let store = await fetch_store()

  if (!store) {
    return { error: { message: 'extension store is not initialized' } }
  }

  if (!store.group_pkg || !store.secret_pkg) {
    return { error: { message: 'signer is not initialized' } }
  }

  if (!store.server_host) {
    return { error: { message: 'signing server hostname is not set' } }
  }

  let group_data, secret_data

  try {
    group_data  = decode_group_pkg(store.group_pkg)
    secret_data = decode_secret_pkg(store.secret_pkg)
  } catch (err) {
    console.error(err)
    return { error: { message: 'failed to decode package data' } }
  }

  console.log('received request:', type)

  //console.log('group data:', group_data)
  //console.log('secret data:', secret_data)

  try {
    switch (type) {
      case 'getPublicKey': {
        return group_data.group_pk.slice(2)
      }
      case 'getRelays': {
        let results = await browser.storage.local.get('relays')
        return results.relays || {}
      }
      case 'signEvent': {
        const { commits, group_pk } = group_data
        const msg  = getEventHash(params.event)
        console.log('msg:', msg)
        const ctx  = get_session_ctx(group_pk, commits, msg)
        console.log('ctx:', ctx)
        const psig = create_psig_pkg(ctx, secret_data)

        const url = `${store.server_host}/api/sign/note`

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ event: params.event, psig })
        })

        console.log(url, res.status, res.statusText)

        if (!res.ok) return { error: { message: res.error } }

        const json = await res.json()

        console.log('json response:', json)

        if (!verify_psig_pkg(ctx, json)) {
          return { error: { message: 'remote signer psig invalid' } }
        }

        const sig   = combine_partial_sigs(ctx, [ psig, json ])
        const event = { ...params.event, sig }

        console.log('signed event:', event)

        return validateEvent(json.event)
          ? event
          : { error: { message: 'invalid event' } }
      }
      case 'nip04.encrypt': {
        // let {peer, plaintext} = params

        return { error: { message: 'not implemented' } }
      }
      case 'nip04.decrypt': {
        // let {peer, ciphertext} = params
        return { error: { message: 'not implemented' } }
      }
      case 'nip44.encrypt': {
        // const {peer, plaintext} = params
        // const key = getSharedSecret(sk, peer)

        return { error: { message: 'not implemented' } }
      }
      case 'nip44.decrypt': {
        // const {peer, ciphertext} = params
        // const key = getSharedSecret(sk, peer)

        return { error: { message: 'not implemented' } }
      }
    }
  } catch (error) {
    return {error: { message: error.message, stack: error.stack }}
  }
}

async function fetch_store () {
  const results = await browser.storage.local.get('store')
  console.log('store:', results.store)
  return results.store
}

async function handlePromptMessage({host, type, accept, conditions}, sender) {
  // return response
  openPrompt?.resolve?.(accept)

  // update policies
  if (conditions) {
    await updatePermission(host, type, accept, conditions)
  }

  // cleanup this
  openPrompt = null

  // release mutex here after updating policies
  releasePromptMutex()

  // close prompt
  if (sender) {
    browser.windows.remove(sender.tab.windowId)
  }
}

async function openSignUpWindow() {
  const {top, left} = await getPosition(width, height)

  browser.windows.create({
    url: `${browser.runtime.getURL('signup.html')}`,
    type: 'popup',
    width: width,
    height: height,
    top: top,
    left: left
  })
}
