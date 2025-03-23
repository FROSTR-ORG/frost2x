import { init_node } from '@/services/node.js'

import type {
  ContentScriptMessage,
  GlobalState
} from '@/types/index.js'

import { MESSAGE_TYPE } from '@/const.js'

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
  }
}
