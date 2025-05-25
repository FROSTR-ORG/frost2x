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
  }
}

async function ping_peer (node: BifrostNode, pubkey: string) {
  await node.req.ping(pubkey)
  return node.peers
}
