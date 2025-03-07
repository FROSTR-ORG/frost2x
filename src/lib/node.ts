import { BifrostNode } from '@frostr/bifrost'

import {
  decode_share_pkg,
  decode_group_pkg
} from '@frostr/bifrost/lib'

import type {
  BifrostNodeConfig,
  GroupPackage,
  SharePackage
} from '@frostr/bifrost'

import type { ExtensionStore, LogEntry } from '../types/index.js'

import browser    from 'webextension-polyfill'
import * as CONST from '../const.js'

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  if (node === null) {
    return init_node()
  }
  return node
}

export async function init_node () : Promise<BifrostNode | null> {

  let store : ExtensionStore

  try {
    const result = await browser.storage.sync.get(['store']) as { store: ExtensionStore }
    store = result.store as ExtensionStore
  } catch (err) {
    console.error('failed to fetch data from storage')
    console.error(err)
    return null
  }

  const { group, peers, relays, share } = store.node

  if (group === null || peers === null || share === null) {
    console.error('extension store is missing required fields')
    return null
  }

  let group_pkg : GroupPackage,
      share_pkg : SharePackage

  try {
    group_pkg = decode_group_pkg(group)
    share_pkg = decode_share_pkg(share)
  } catch (err) {
    console.error('failed to decode package data')
    console.error(err)
    return null
  }

  const opt : Partial<BifrostNodeConfig> = {
    policies : peers ?? []
  }

  const relay_urls = relays
    .filter((relay) => relay.write)
    .map((relay) => relay.url)

  const node = new BifrostNode(group_pkg, share_pkg, relay_urls, opt)

  node.on('ready', async () => {
    await clear_logs()
    console.log('background node connected')
    log('background node connected', 'success')
  })

  node.on('message', (msg) => {
    console.log('received message event:', msg.env.id)
    log(`received message event: ${msg.env.id}`, 'info')
  })

  node.on('closed', () => {
    console.log('background node closed')
    log('background node closed', 'info')
  })

  return node.connect()
}

async function log (
  message : string,
  type    : 'info' | 'error' | 'warning' | 'success'
) : Promise<void> {
  const logs      = await fetch_logs()
  const timestamp = new Date().toISOString()
  const entry     = { timestamp, message, type }
  return update_logs([ ...logs, entry ])
}

async function fetch_logs () : Promise<LogEntry[]> {
  const result = await browser.storage.sync.get(['logs'])
  return (result.logs ?? []) as LogEntry[]
}

async function update_logs (logs : LogEntry[]) : Promise<void> {
  const trimmed = logs.slice(-CONST.MAX_LOGS)
  return browser.storage.sync.set({ logs: trimmed })
}

async function clear_logs () : Promise<void> {
  return browser.storage.sync.set({ logs: [] })
}
