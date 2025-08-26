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
