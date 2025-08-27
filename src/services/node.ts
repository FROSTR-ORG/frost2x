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
    'xprv', 'seed', 'mnemonic', 'entropy',
    'psbt', 'signatures', 'signature', 'witness', 'witnesses',
    'witnessutxo', 'witnessUtxo',  // Both cases for PSBT fields
    'finalscriptsig', 'finalscriptwitness', 'scriptsig',
    'binder_sn', 'hidden_sn', 'secnonce', 'nonce',
    'password', 'passphrase', 'pin'
  ])
  
  // Regex patterns for common secret field naming conventions
  // Using word boundaries and explicit patterns to avoid false positives
  const secretPatterns = [
    // Token patterns (access_token, refresh_token, id_token, auth_token, etc.)
    /^(access|refresh|id|auth|bearer|session|jwt)[-_]?token$/i,
    /^token$/i,
    
    // API and client keys
    /^api[-_]?key$/i,
    /^apikey$/i,
    /^client[-_]?(key|secret)$/i,
    
    // Private/secret keys
    /^private[-_]?key$/i,
    /^privatekey$/i,
    /^secret[-_]?key$/i,
    /^secretkey$/i,
    
    // Generic secrets and passwords
    /^secret$/i,
    /^password$/i,
    /^passphrase$/i,
    /^pin$/i,
    /^seed$/i,
    
    // Suffix patterns (anything ending with these)
    /^.*[-_](secret|private|password|passphrase|token|key|seed|pin)$/i,
    
    // Prefix patterns (anything starting with these)
    /^(secret|private|auth|api)[-_].*$/i
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
  try {
    const { group, peers, relays, share } = await NodeStore.fetch()
    const settings = await SettingStore.fetch()

    if (group == null || peers == null || share == null) {
      return null
    }

    const relay_urls = (relays ?? [])
      .filter((relay) => relay.write)
      .map((relay) => relay.url)

    // Check if we have at least one relay URL
    if (relay_urls.length === 0) {
      console.error('No relay URLs available. Relays:', relays)
      throw new Error('No relay URLs configured for write access')
    }

    // WORKAROUND: BifrostNode constructor validation is inconsistent
    // Sometimes it requires a config, sometimes it rejects any config
    // We try multiple approaches until one succeeds
    let node: BifrostNode
    let configUsed: any = null
    
    // Approach 1: Try without any config (simplest case)
    try {
      node = new BifrostNode(group, share, relay_urls)
      configUsed = 'no config'
    } catch (e1) {
      // Approach 2: Try with empty config object
      try {
        node = new BifrostNode(group, share, relay_urls, {})
        configUsed = {}
      } catch (e2) {
        // Approach 3: Try with policies only (no sign_ival)
        try {
          const policiesOnly = { policies: peers ?? [] }
          node = new BifrostNode(group, share, relay_urls, policiesOnly)
          configUsed = policiesOnly
        } catch (e3) {
          // Approach 4: Try with full config (policies + sign_ival)
          // This is the most complete config, default sign_ival is 100ms
          const fullConfig : Partial<BifrostNodeConfig> = {
            policies  : peers ?? [],
            sign_ival : settings?.node?.rate_limit ?? 100
          }
          node = new BifrostNode(group, share, relay_urls, fullConfig)
          configUsed = fullConfig
        }
      }
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
        policyCount   : peers?.length ?? 0,
        rateLimit     : settings?.node?.rate_limit ?? 100,
        configType    : configUsed === 'no config' ? 'none' : typeof configUsed
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
  } catch (error) {
    // Log the initialization failure with details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    await LogStore.add(
      `Failed to initialize Bifrost node: ${errorMessage}`, 
      'error',
      {
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      }
    )
    
    console.error('Failed to initialize Bifrost node:', error)
    
    // Rethrow to preserve current upstream behavior
    throw error
  }
}
