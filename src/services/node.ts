import { BifrostNode }         from '@frostr/bifrost'
import { fetchExtensionStore } from '../stores/extension.js'
import { addLog, clearLogs }   from '../stores/logs.js'

import type { BifrostNodeConfig } from '@frostr/bifrost'

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  return (node === null) ? init_node() : node
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
    await clearLogs()
    log('background node connected', 'success')
    console.log('background node connected')
  })

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, msg ] = args
    if (filter.includes(event)) return
    log(`[ ${event} ] ${msg}`, 'info')
  })

  node.on('closed', () => {
    log('background node closed', 'info')
    console.log('background node closed')
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
