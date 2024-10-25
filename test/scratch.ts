import { Buff } from '@cmdcode/buff'
import { generateSecretKey } from 'nostr-tools'

const sk = generateSecretKey()

console.log(Buff.raw(sk).hex)
