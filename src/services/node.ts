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
    policies      : peers ?? [],
    sign_ival     : rate_limit
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

  const filter = [ 'ready', 'message', 'closed' ]

  node.on('*', (...args : any[]) => {
    const [ event, msg ] = args
    if (filter.includes(event)) return
    const logMessage = typeof msg === 'string' ? msg : JSON.stringify(msg)
    LogStore.add(`[ ${event} ] ${logMessage}`, 'info')
  })

  node.on('closed', () => {
    LogStore.add('bifrost node disconnected', 'info')
    console.log('bifrost node disconnected')
  })

  // Connect the node
  await node.connect()
  
  // Wait for the node to be ready before returning
  return new Promise((resolve, reject) => {
    // If the node is already ready, resolve immediately
    if (node.req) {
      resolve(node)
      return
    }
    
    // Otherwise wait for the ready event
    const timeout = setTimeout(() => {
      reject(new Error('Node initialization timeout'))
    }, 10000) // 10 second timeout
    
    node.once('ready', () => {
      clearTimeout(timeout)
      resolve(node)
    })
    
    node.once('error', (error: any) => {
      clearTimeout(timeout)
      reject(error)
    })
  })
}
