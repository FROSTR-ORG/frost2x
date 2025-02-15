import { BifrostNode } from '@frostr/bifrost'

import {
  decode_group_pkg,
  decode_share_pkg
} from '@frostr/bifrost/lib'

import CRED from './cred.json' assert { type: 'json' }

export function get_node () {

  const relays = [ 'ws://localhost:8002' ]
  const group  = decode_group_pkg(CRED.group)
  const share  = decode_share_pkg(CRED.share)

  return new BifrostNode(group, share, relays)
}
