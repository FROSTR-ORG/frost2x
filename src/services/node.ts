import { BifrostNode }  from '@frostr/bifrost'
import { NodeStore }    from '@/stores/node.js'
import { SettingStore } from '@/stores/settings.js'
import { LogStore }     from '@/stores/logs.js'

import type { BifrostNodeConfig } from '@frostr/bifrost'

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  return (node === null) ? init_node() : node
}

export async function init_node () : Promise<BifrostNode | null> {
  const { group, peers, relays, share } = await NodeStore.fetch()

  const { node : { rate_limit } } = await SettingStore.fetch()

  if (group === null || peers === null || share === null) {
    return null
  }

  const opt : Partial<BifrostNodeConfig> = {
    policies  : peers ?? [],
    sign_ival : rate_limit
  }

  const relay_urls = relays
    .filter((relay) => relay.write)
    .map((relay) => relay.url)

  const node = new BifrostNode(group, share, relay_urls, opt)

  node.on('ready', async () => {
    await LogStore.clear()
    LogStore.add('bifrost node connected', 'success')
    console.log('bifrost node connected')
  })

  node.once('ready', () => {
    node.peers.forEach((peer) => {
      node.req.ping(peer.pubkey)
    })
    console.dir(node, { depth: null })
  })

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, msg ] = args
    if (filter.includes(event)) return
    LogStore.add(`[ ${event} ] ${msg}`, 'info')
    console.log(`[ ${event} ] payload:`)
    console.dir(msg, { depth: null })
  })

  node.on('closed', () => {
    LogStore.add('bifrost node disconnected', 'info')
    console.log('bifrost node disconnected')
  })

  return node.connect().then(() => node)
}
