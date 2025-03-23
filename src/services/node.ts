import { BifrostNode } from '@frostr/bifrost'
import { NodeStore }   from '@/stores/node.js'
import { LogStore }    from '@/stores/logs.js'

import type { BifrostNodeConfig } from '@frostr/bifrost'

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  return (node === null) ? init_node() : node
}

export async function init_node () : Promise<BifrostNode | null> {
  let store = await NodeStore.fetch()

  const { group, peers, relays, share } = store

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
    await LogStore.clear()
    LogStore.add('background node connected', 'success')
    console.log('background node connected')
  })

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, msg ] = args
    if (filter.includes(event)) return
    LogStore.add(`[ ${event} ] ${msg}`, 'info')
  })

  node.on('closed', () => {
    LogStore.add('background node closed', 'info')
    console.log('background node closed')
  })

  return node.connect()
}
