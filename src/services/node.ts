import { BifrostNode }  from '@frostr/bifrost'
import { NodeStore }    from '@/stores/node.js'
import { SettingStore } from '@/stores/settings.js'
import { LogStore }     from '@/stores/logs.js'
import { get_pubkey }    from '@frostr/bifrost/util'

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

  node.once('ready', async () => {
    // Ping all peers
    node.peers.forEach((peer) => {
      node.req.ping(peer.pubkey)
    })
    
    // Send an echo to ourselves to confirm the share handoff
    try {
      const myPubkey = get_pubkey(share.seckey, 'ecdsa').slice(2)
      const result = await node.req.echo('echo', [ myPubkey ])
      
      if (result.ok) {
        LogStore.add('Share handoff confirmed: Echo sent successfully', 'success')
        console.log('Share handoff echo successful:', result.data)
      } else {
        LogStore.add('Share handoff echo failed', 'warning')
        console.log('Share handoff echo failed:', result.err)
      }
    } catch (err) {
      LogStore.add('Share handoff echo error', 'warning')
      console.error('Echo error:', err)
    }
    
    console.dir(node, { depth: null })
  })

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, ...data ] = args
    if (event.startsWith('/ping')) return
    if (filter.includes(event))    return
    
    // Just log all events generically (including echo)
    LogStore.add(`${event}`, 'info')
    console.log(`[ ${event} ] payload:`)
    console.dir(data, { depth: null })
  })

  node.on('closed', () => {
    LogStore.add('bifrost node disconnected', 'info')
    console.log('bifrost node disconnected')
  })

  return node.connect().then(() => node)
}
