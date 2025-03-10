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

export function get_message_keys (
  convo_key : Uint8Array,
  nonce     : Uint8Array,
): { chacha_key: Uint8Array; chacha_nonce: Uint8Array; hmac_key: Uint8Array } {
  const keys = hkdf_expand(sha256, convo_key, nonce, 76)
  return {
    chacha_key   : keys.subarray(0, 32),
    chacha_nonce : keys.subarray(32, 44),
    hmac_key     : keys.subarray(44, 76),
  }
}

export function calc_padded_len (len: number) : number {
  if (!Number.isSafeInteger(len) || len < 1) throw new Error('expected positive integer')
  if (len <= 32) return 32
  const nextPower = 1 << (Math.floor(Math.log2(len - 1)) + 1)
  const chunk = nextPower <= 256 ? 32 : nextPower / 8
  return chunk * (Math.floor((len - 1) / chunk) + 1)
}

export function write_u16_be (num: number) : Uint8Array {
  if (!Number.isSafeInteger(num) || num < minPlaintextSize || num > maxPlaintextSize)
    throw new Error('invalid plaintext size: must be between 1 and 65535 bytes')
  const arr = new Uint8Array(2)
  new DataView(arr.buffer).setUint16(0, num, false)
  return arr
}

export function pad (plaintext: string) : Uint8Array {
  const unpadded    = encoder.encode(plaintext)
  const unpaddedLen = unpadded.length
  const prefix = write_u16_be(unpaddedLen)
  const suffix = new Uint8Array(calc_padded_len(unpaddedLen) - unpaddedLen)
  return concatBytes(prefix, unpadded, suffix)
}

export function unpad (padded: Uint8Array) : string {
  const unpaddedLen = new DataView(padded.buffer).getUint16(0)
  const unpadded = padded.subarray(2, 2 + unpaddedLen)
  if (
    unpaddedLen < minPlaintextSize ||
    unpaddedLen > maxPlaintextSize ||
    unpadded.length !== unpaddedLen ||
    padded.length !== 2 + calc_padded_len(unpaddedLen)
  )
    throw new Error('invalid padding')
  return decoder.decode(unpadded)
}

export function hmac_aad (
  key     : Uint8Array,
  message : Uint8Array,
  aad     : Uint8Array
) : Uint8Array {
  if (aad.length !== 32) throw new Error('AAD associated data must be 32 bytes')
  const combined = concatBytes(aad, message)
  return hmac(sha256, key, combined)
}

// metadata: always 65b (version: 1b, nonce: 32b, max: 32b)
// plaintext: 1b to 0xffff
// padded plaintext: 32b to 0xffff
// ciphertext: 32b+2 to 0xffff+2
// raw payload: 99 (65+32+2) to 65603 (65+0xffff+2)
// compressed payload (base64): 132b to 87472b
export function decode_payload (
  payload: string
) : { nonce: Uint8Array; ciphertext: Uint8Array; mac: Uint8Array } {
  if (typeof payload !== 'string') throw new Error('payload must be a valid string')
  const plen = payload.length
  if (plen < 132 || plen > 87472) throw new Error('invalid payload length: ' + plen)
  if (payload[0] === '#') throw new Error('unknown encryption version')
  let data: Uint8Array
  try {
    data = base64.decode(payload)
  } catch (error) {
    throw new Error('invalid base64: ' + (error as any).message)
  }
  const dlen = data.length
  if (dlen < 99 || dlen > 65603) throw new Error('invalid data length: ' + dlen)
  const vers = data[0]
  if (vers !== 2) throw new Error('unknown encryption version ' + vers)
  return {
    nonce: data.subarray(1, 33),
    ciphertext: data.subarray(33, -32),
    mac: data.subarray(-32),
  }
}
