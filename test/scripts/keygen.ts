import { Buff } from '@cmdcode/buff'

import {
  encode_group_pkg,
  encode_share_pkg,
  generate_dealer_pkg
} from '@frostr/bifrost/lib'

// Define the threshold for the signing group.
const THRESHOLD  = 2
// Define the total share count for the signing group.
const MEMBERS    = 3
// Capture the user input, or define a default input.
const param = process.argv[2] ?? Buff.random(32).hex
// Define a variable for our secret key.
let SECRET_KEY : string

if (param.startsWith('nsec')) {
  SECRET_KEY = Buff.bech32(param).hex
} else {
  SECRET_KEY = Buff.hex(param).hex
}

// Log our secret key to console.
console.log('secret key:', SECRET_KEY)
// Generate a dealer package of group commitments and shares.
const pkg = generate_dealer_pkg(THRESHOLD, MEMBERS, [ SECRET_KEY ])
// Log our dealer package to console.
console.log('\ndealer package:', JSON.stringify(pkg, null, 2))
// Encode the group commitments as bech32m string.
const group  = encode_group_pkg(pkg.group)
// Encode each share as bech32m string.
const shares = pkg.shares.map(encode_share_pkg)
// Log our credentials to console.
console.log('\ncredentials:', JSON.stringify({ group, shares }, null, 2))
