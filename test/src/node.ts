import { BifrostNode } from '@frostr/bifrost'

import {
  decode_group_pkg,
  decode_share_pkg
} from '@frostr/bifrost/encoder'

interface NodeConfig {
  group  : string
  relays : string[]
  share  : string
}

export function get_node (config : NodeConfig) {
  const group = decode_group_pkg(config.group)
  const share = decode_share_pkg(config.share)
  const node  = new BifrostNode(group, share, config.relays, { debug: true })

  node.client.on('ready', () => {
    console.log('node connected')
  })
  
  node.on('*', (...args) => {
    console.log(args)
  })

  return node
}
