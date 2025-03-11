import { BifrostNode }         from '@frostr/bifrost'
import { fetchExtensionStore } from '../stores/extension.js'
import { addLog }              from '../stores/logs.js'

import type { BifrostNodeConfig } from '@frostr/bifrost'

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  if (node === null) {
    return init_node()
  }
  return node
}

export async function init_node () : Promise<BifrostNode | null> {
  let store = await fetchExtensionStore()

  const { group, peers, relays, share } = store.node

  if (group === null || peers === null || share === null) {
    console.error('extension store is missing required fields')
    return null
  }

  const opt : Partial<BifrostNodeConfig> = {
    policies : peers ?? []
  }

  const relay_urls = relays
    .filter((relay) => relay.write)
    .map((relay) => relay.url)

  const node = new BifrostNode(group, share, relay_urls, opt)

  node.on('ready', async () => {
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
  const timestamp = new Date().toISOString()
  const entry     = { timestamp, message, type }

  await addLog(entry)
}
