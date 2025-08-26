import { BifrostNode }  from '@frostr/bifrost'
import { NodeStore }    from '@/stores/node.js'
import { SettingStore } from '@/stores/settings.js'
import { LogStore }     from '@/stores/logs.js'

import type { BifrostNodeConfig } from '@frostr/bifrost'

// Safe serialization helper to handle cyclic/large objects
function safeSerialize(data: any, maxLength: number = 50000): any {
  if (data === undefined) return undefined
  
  try {
    const seen = new WeakSet()
    const serialized = JSON.stringify(data, (_key, value) => {
      // Drop functions
      if (typeof value === 'function') return '[Function]'
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]'
        seen.add(value)
      }
      return value
    })
    
    // Check size limit
    if (serialized.length > maxLength) {
      return '[Data too large to serialize]'
    }
    
    // Parse back to ensure clean object
    return JSON.parse(serialized)
  } catch (err) {
    return '[Non-serializable data]'
  }
}

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
      // Send echo to confirm share handoff (broadcasts to all peers including ourselves)
      const result = await node.req.echo('echo')
      
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
    
    // Avoid logging the full node instance to prevent leaking sensitive data (e.g., key shares)
    const safeNodeInfo = {
      peerPubkeys   : Array.isArray(node.peers) ? node.peers.map((peer) => peer.pubkey) : [],
      relayUrlCount : relay_urls.length,
      policyCount   : Array.isArray(opt.policies) ? opt.policies.length : undefined,
      rateLimit     : opt.sign_ival
    }
    console.log('bifrost node summary:', safeNodeInfo)
  })

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, ...data ] = args
    if (event.startsWith('/ping')) return
    if (filter.includes(event))    return
    
    // Log events with their data payload for expandable viewing
    const eventData = safeSerialize(data.length > 0 ? data : undefined)
    LogStore.add(`${event}`, 'info', eventData)
    console.log(`[ ${event} ] payload:`)
    if (eventData !== undefined) {
      console.log(JSON.stringify(eventData, null, 2))
    }
  })

  node.on('closed', () => {
    LogStore.add('bifrost node disconnected', 'info')
    console.log('bifrost node disconnected')
  })

  return node.connect().then(() => node)
}
