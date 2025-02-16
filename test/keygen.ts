import { Buff } from '@cmdcode/buff'

import {
  encode_group_pkg,
  encode_share_pkg,
  generate_dealer_pkg
} from '@frostr/bifrost/lib'

const THRESHOLD  = 2
const MEMBERS    = 3

let SECRET_KEY = Buff.random(32).hex

if (typeof process.argv[2] === 'string') {
  const param = process.argv[2]
  if (param.startsWith('nsec')) {
    SECRET_KEY = Buff.bech32(param).hex
  } else {
    SECRET_KEY = Buff.hex(param).hex
  }
}

console.log('secret key:', SECRET_KEY)

const pkg = generate_dealer_pkg(THRESHOLD, MEMBERS, [ SECRET_KEY ])

console.log('dealer package:', JSON.stringify(pkg, null, 2))

const group  = encode_group_pkg(pkg.group)
const shares = pkg.shares.map(encode_share_pkg)
const creds  = { group, shares }

console.log('credentials:', JSON.stringify(creds, null, 2))
