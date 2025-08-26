import { init_node }    from '@/services/node.js'
import { MESSAGE_TYPE } from '@/const.js'

import type {
  ContentScriptMessage,
  GlobalState
} from '@/types/index.js'

import type { BifrostNode } from '@frostr/bifrost'

export async function handleNodeRequest (
  ctx : GlobalState,
  msg : ContentScriptMessage
) {
  const { node } = ctx
  const { type } = msg

  switch (type) {
    case MESSAGE_TYPE.NODE_RESET:
      try {
        ctx.node = await init_node()
        return { status: ctx.node !== null ? 'running' : 'stopped' }
      } catch (error) {
        console.error('Failed to reset node:', error)
        return { 
          status: 'stopped', 
          error: error instanceof Error ? error.message : 'Failed to initialize node' 
        }
      }
    case MESSAGE_TYPE.NODE_STATUS:
      return { status: node !== null ? 'running' : 'stopped' }
    case MESSAGE_TYPE.PEER_STATUS:
      return { peers: node !== null ? node.peers : [] }
    case MESSAGE_TYPE.PEER_PING:
      try {
        if (!msg.params || msg.params.length < 1) {
          return { result: [], error: 'Missing pubkey parameter' }
        }
        return { result: node !== null ? await ping_peer(node, msg.params[0]) : [], error: null }
      } catch (error) {
        return { result: [], error: error instanceof Error ? error.message : 'Unknown error' }
      }
    case MESSAGE_TYPE.PEER_ECHO:
      try {
        if (!msg.params || msg.params.length < 1) {
          return { result: null, error: 'Missing pubkey parameter' }
        }
        return { result: node !== null ? await echo_peer(node, msg.params[0], msg.params[1]) : null, error: null }
      } catch (error) {
        return { result: null, error: error instanceof Error ? error.message : 'Unknown error' }
      }
  }
}

async function ping_peer (node: BifrostNode, pubkey: string) {
  try {
    await node.req.ping(pubkey)
    return node.peers
  } catch (error) {
    console.error('Ping peer failed:', error)
    return node.peers // Return current state even if ping failed
  }
}

async function echo_peer (node: BifrostNode, pubkey: string, message?: string) {
  try {
    const content = message || `Echo test from frost2x at ${new Date().toISOString()}`
    
    // IMPORTANT: The Bifrost echo function broadcasts to ALL connected peers,
    // not to a specific peer. The pubkey parameter is kept for API consistency
    // but is not used for targeting. The response indicates if ANY peer responded.
    const result = await node.req.echo(content)
    
    if (result.ok) {
      return {
        success: true,
        broadcast: true,  // Indicate this was a broadcast
        target_peer: pubkey,  // The peer we intended to test (for UI purposes)
        message: content,
        response: result.data,
        timestamp: Date.now()
      }
    } else {
      return {
        success: false,
        broadcast: true,
        target_peer: pubkey,
        message: content,
        error: result.err || 'Echo broadcast failed',
        timestamp: Date.now()
      }
    }
  } catch (error) {
    return {
      success: false,
      broadcast: true,
      target_peer: pubkey,
      message: message || '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }
  }
}
