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
      ctx.node = await init_node()
      return { status: node !== null ? 'running' : 'stopped' }
    case MESSAGE_TYPE.NODE_STATUS:
      return { status: node !== null ? 'running' : 'stopped' }
    case MESSAGE_TYPE.PEER_STATUS:
      return { status: node !== null ? node.peers : [] }
    case MESSAGE_TYPE.PEER_PING:
      return { status: node !== null ? await ping_peer(node, msg.params[0]) : [] }
    case MESSAGE_TYPE.PEER_ECHO:
      return { status: node !== null ? await echo_peer(node, msg.params[0], msg.params[1]) : null }
  }
}

async function ping_peer (node: BifrostNode, pubkey: string) {
  await node.req.ping(pubkey)
  return node.peers
}

async function echo_peer (node: BifrostNode, pubkey: string, message?: string) {
  try {
    const content = message || `Echo test from frost2x at ${new Date().toISOString()}`
    const result = await node.req.echo(content, [ pubkey ])
    
    if (result.ok) {
      return {
        success: true,
        peer: pubkey,
        message: content,
        response: result.data,
        timestamp: Date.now()
      }
    } else {
      return {
        success: false,
        peer: pubkey,
        message: content,
        error: result.err || 'Echo request failed',
        timestamp: Date.now()
      }
    }
  } catch (error) {
    return {
      success: false,
      peer: pubkey,
      message: message || '',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    }
  }
}
