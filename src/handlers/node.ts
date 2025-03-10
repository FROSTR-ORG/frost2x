import { init_node } from '../lib/node.js'

import type { ContentScriptMessage, GlobalState } from '../types/index.js'

export async function handleNodeRequest (
  ctx : GlobalState,
  msg : ContentScriptMessage
) {
  const { node } = ctx
  const { type } = msg

  switch (type) {
    case 'node.reset':
      ctx.node = await init_node()
      return { status: node !== null ? 'running' : 'stopped' }
    case 'node.status':
      return { status: node !== null ? 'running' : 'stopped' }
  }
}
