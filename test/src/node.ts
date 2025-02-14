import { BifrostNode } from '@frostr/bifrost'

import {
  decode_group_pkg,
  decode_share_pkg
} from '@frostr/bifrost/lib'

import CREDS from './cred.json' assert { type: 'json' }

export function get_node () {

  const relays = [ 'ws://localhost:8002' ]
  const group  = decode_group_pkg(CREDS.group)
  const share  = decode_share_pkg(CREDS.share)

  return new BifrostNode(group, share, relays)
}
