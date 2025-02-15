import { Buff } from '@cmdcode/buff'

import {
  encode_group_pkg,
  encode_share_pkg,
  generate_dealer_pkg
} from '@frostr/bifrost/lib'

const SECRET_KEY = process.argv[2] || Buff.random(32).hex
const THRESHOLD  = 2
const MEMBERS    = 3

console.log('secret key:', SECRET_KEY)

const pkg = generate_dealer_pkg(THRESHOLD, MEMBERS, [ SECRET_KEY ])

console.log('dealer package:', JSON.stringify(pkg, null, 2))

const group  = encode_group_pkg(pkg.group)
const shares = pkg.shares.map(encode_share_pkg)

console.log('credentials:', JSON.stringify({ group, shares }, null, 2))
