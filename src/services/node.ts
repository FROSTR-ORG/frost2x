import browser          from 'webextension-polyfill'
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

// Redact sensitive data from objects before logging
function redactSecrets(data: any): any {
  if (data === undefined || data === null) return data
  
  // Exact keys to redact (case-insensitive)
  const exactKeys = new Set([
    'seckey', 'secret', 'share', 'shares', 'private', 'privatekey',
    'xprv', 'xpub', 'seed', 'mnemonic', 'entropy',
    'psbt', 'signatures', 'signature', 'witness', 'witnesses',
    'finalscriptsig', 'finalscriptwitness', 'scriptsig',
    'binder_sn', 'hidden_sn', 'secnonce', 'nonce',
    'password', 'passphrase', 'pin'
  ])
  
  // Regex patterns for common secret field naming conventions
  const secretPatterns = [
    /^apikey$/i,
    /^privatekey$/i,
    /^secretkey$/i,
    /^.*_secret$/i,
    /^.*_private$/i,
    /^.*_seed$/i,
    /^.*_password$/i,
    /^.*_passphrase$/i,
    /^auth.*token$/i
  ]
  
  // WeakMap to handle circular references
  const visited = new WeakMap()
  
  function redact(obj: any): any {
    // Handle primitives
    if (obj === null || obj === undefined) return obj
    if (typeof obj !== 'object') return obj
    
    // Check for circular reference
    if (visited.has(obj)) return visited.get(obj)
    
    // Handle arrays
    if (Array.isArray(obj)) {
      const redacted: any[] = []
      visited.set(obj, redacted)
      obj.forEach((item, index) => {
        redacted[index] = redact(item)
      })
      return redacted
    }
    
    // Handle objects
    const redacted: any = {}
    visited.set(obj, redacted)
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase()
        
        // First check exact matches
        const isExactMatch = exactKeys.has(lowerKey)
        
        // Then check regex patterns
        const isPatternMatch = secretPatterns.some(pattern => pattern.test(key))
        
        if (isExactMatch || isPatternMatch) {
          redacted[key] = '[REDACTED]'
        } else {
          redacted[key] = redact(obj[key])
        }
      }
    }
    
    return redacted
  }
  
  return redact(data)
}

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  return (node === null) ? init_node() : node
}

export async function init_node () : Promise<BifrostNode | null> {
  console.log('Initializing Bifrost node...')
  
  const nodeData = await NodeStore.fetch()
  const { group, peers, relays, share } = nodeData
  
  console.log('Node data loaded:', {
    hasGroup: group !== null,
    hasPeers: peers !== null,
    hasShare: share !== null,
    relayCount: relays?.length || 0
  })

  const { node : { rate_limit } } = await SettingStore.fetch()

  if (group === null || peers === null || share === null) {
    console.log('Missing required node configuration:', { group, peers, share })
    return null
  }

  // Debug peers structure
  console.log('Raw peers from store:', peers)
  console.log('Peers is array?', Array.isArray(peers))
  console.log('Peers length:', peers?.length)
  if (peers && peers.length > 0) {
    console.log('First peer structure:', peers[0])
  }
  
  // BifrostNode might expect 'policies' to be in a different format
  // Let's try passing it as-is first, then we'll modify if needed
  const opt : Partial<BifrostNodeConfig> = {
    policies  : peers ?? [],
    sign_ival : rate_limit
  }
  
  // Also try an alternative - maybe it expects just pubkeys or a different structure
  console.log('Policies type check:', {
    isPeersArray: Array.isArray(peers),
    firstPeerType: peers?.[0] ? typeof peers[0] : 'undefined',
    firstPeerKeys: peers?.[0] ? Object.keys(peers[0]) : []
  })
  
  console.log('Full peers data:', JSON.stringify(peers, null, 2))
  console.log('Options being passed:', JSON.stringify(opt, null, 2))

  const relay_urls = relays
    .filter((relay) => relay.write)
    .map((relay) => relay.url)

  console.log('Creating BifrostNode with:', {
    relayCount: relay_urls.length,
    relayUrls: relay_urls,
    policyCount: opt.policies?.length,
    rateLimit: opt.sign_ival
  })

  // Log the actual data being passed (redacted for security)
  console.log('Group package:', {
    hasCommits: group.commits && Array.isArray(group.commits),
    commitCount: group.commits?.length,
    threshold: group.threshold,
    hasGroupPk: !!group.group_pk
  })

  console.log('Share package:', {
    idx: share.idx,
    hasSeckey: !!share.seckey,
    hasBinderSn: !!share.binder_sn,
    hasHiddenSn: !!share.hidden_sn
  })

  console.log('Peer configs:', peers?.map(p => ({
    hasPubkey: !!p.pubkey,
    hasPolicy: !!p.policy,
    send: p.policy?.send,
    recv: p.policy?.recv
  })))

  // Validate the data before passing to BifrostNode
  if (!group.group_pk || !group.threshold || !group.commits) {
    console.error('Invalid group structure:', group)
    throw new Error('Group package is missing required fields')
  }
  
  if (!share.seckey || typeof share.idx !== 'number') {
    console.error('Invalid share structure:', share)
    throw new Error('Share package is missing required fields')
  }

  let node: BifrostNode
  try {
    // The BifrostNode constructor signature is: (group, share, relays, config?)
    // Make sure we're passing the right types
    console.log('Attempting to create BifrostNode...')
    
    // First try without any config to see if that's the issue
    console.log('Trying without config...')
    try {
      node = new BifrostNode(group, share, relay_urls)
      console.log('Success without config!')
    } catch (e1) {
      console.log('Failed without config:', (e1 as Error).message)
      
      // Now try with just sign_ival
      console.log('Trying with just sign_ival...')
      try {
        node = new BifrostNode(group, share, relay_urls, { sign_ival: rate_limit })
        console.log('Success with just sign_ival!')
      } catch (e2) {
        console.log('Failed with just sign_ival:', (e2 as Error).message)
        
        // Finally try with full config
        console.log('Trying with full config including policies...')
        node = new BifrostNode(group, share, relay_urls, opt)
      }
    }
    console.log('BifrostNode created successfully')
  } catch (error) {
    console.error('Failed to create BifrostNode:', error)
    console.error('Full error object:', error)
    console.error('Error toString:', String(error))
    // Log the actual values being passed
    console.error('Constructor params:', {
      groupType: typeof group,
      shareType: typeof share, 
      relayUrlsType: typeof relay_urls,
      relayUrlsIsArray: Array.isArray(relay_urls),
      optType: typeof opt
    })
    throw error
  }

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
    
    // Redact sensitive data before logging
    const redactedData = redactSecrets(data.length > 0 ? data : undefined)
    // Serialize the already-redacted data
    const eventData = safeSerialize(redactedData)
    
    // Log redacted events for safe debugging
    LogStore.add(`${event}`, 'info', eventData)
    
    // Only log to console in development
    let isDevelopment = false
    
    try {
      // First check for explicit Node.js/test environment flags
      if (typeof process !== 'undefined' && process.env) {
        isDevelopment = process.env.NODE_ENV === 'development' || 
                       process.env.DEBUG === 'true' || 
                       process.env.EXT_DEV === 'true'
      } 
      // Then check browser environment
      else if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.getManifest) {
        const manifest = browser.runtime.getManifest() as any
        
        // Don't treat Firefox as dev by default
        const isFirefox = typeof navigator !== 'undefined' && 
                         navigator.userAgent && 
                         navigator.userAgent.includes('Firefox')
        
        // Chrome/Edge dev mode: no update_url in manifest
        // Firefox: has update_url even in dev, so don't use this check
        if (!isFirefox) {
          isDevelopment = !manifest.update_url
        }
      }
    } catch (err) {
      // If we can't determine environment, default to not logging
      isDevelopment = false
    }
    
    if (isDevelopment) {
      console.log(`[ ${event} ] payload:`)
      if (eventData !== undefined) {
        console.log(JSON.stringify(eventData, null, 2))
      }
    }
  })

  node.on('closed', () => {
    LogStore.add('bifrost node disconnected', 'info')
    console.log('bifrost node disconnected')
  })

  return node.connect().then(() => node)
}
