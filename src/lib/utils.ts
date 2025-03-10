import { Buff }        from '@cmdcode/buff'
import { base64 }      from '@scure/base'
import { hmac }        from '@noble/hashes/hmac'
import { sha256 }      from '@noble/hashes/sha256'
import { concatBytes } from '@noble/hashes/utils'

import {
  extract as hkdf_extract,
  expand as hkdf_expand
} from '@noble/hashes/hkdf'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const minPlaintextSize = 0x0001 // 1b msg => padded to 32b
const maxPlaintextSize = 0xffff // 65535 (64kb-1) => padded to 64kb

export function get_conversation_key (shared_secret : string): Uint8Array {
  const secret = Buff.hex(shared_secret)
  return hkdf_extract(sha256, secret, 'nip44-v2')
}

export function parse_json <T extends Record<string, any>> (
  json_str: string
) : T | null {
  try {
    return JSON.parse(json_str) as T
  } catch  {
    return null
  }
}
