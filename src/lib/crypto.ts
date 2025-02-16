import { Buff }       from '@cmdcode/buff'
import { cbc }        from '@noble/ciphers/aes'
import { chacha20 }   from '@noble/ciphers/chacha'
import { equalBytes } from '@noble/ciphers/utils'
import { base64 }     from '@scure/base'

import {
  concatBytes,
  randomBytes
} from '@noble/hashes/utils'

import * as utils from './utils.js'

/**
 * Encrypts content using the NIP-44 encryption scheme.
 * @param plaintext The content to encrypt
 * @param secret The encryption key in hex format
 * @param nonce The nonce for the encryption (default is a random 32-byte array)
 * @returns The encrypted content in base64url format with the nonce and MAC  
 */
export function nip44_encrypt (
  plaintext : string, 
  secret    : string,
  nonce     : Uint8Array = randomBytes(32)): string {
  const convo_key  = utils.get_conversation_key(secret)
  const ctx        = utils.get_message_keys(convo_key, nonce)
  const padded     = utils.pad(plaintext)
  const ciphertext = chacha20(ctx.chacha_key, ctx.chacha_nonce, padded)
  const mac        = utils.hmac_aad(ctx.hmac_key, ciphertext, nonce)
  return base64.encode(concatBytes(new Uint8Array([2]), nonce, ciphertext, mac))
}

/**
 * Decrypts encrypted content using the provided secret.
 * @param payload Encrypted content in base64url format
 * @param secret  Decryption key in hex format
 * @returns       Decrypted content as string
 */
export function nip44_decrypt (
  payload : string, 
  secret  : string
): string {
  const { nonce, ciphertext, mac } = utils.decode_payload(payload)
  const convo_key      = utils.get_conversation_key(secret)
  const ctx            = utils.get_message_keys(convo_key, nonce)
  const calculated_mac = utils.hmac_aad(ctx.hmac_key, ciphertext, nonce)
  if (!equalBytes(calculated_mac, mac)) throw new Error('invalid MAC')
  const padded = chacha20(ctx.chacha_key, ctx.chacha_nonce, ciphertext)
  return utils.unpad(padded)
}

/**
 * Encrypts content using AES-CBC with an optional initialization vector.
 * @param secret    Encryption key in hex format
 * @param content   Content to encrypt
 * @param iv        Optional initialization vector in hex format
 * @returns         Encrypted content in base64url format with IV
 */
export function nip04_encrypt (
  secret  : string,
  content : string,
  iv?     : string
) {
  const cbytes = Buff.str(content)
  const sbytes = Buff.hex(secret)
  const vector = (iv !== undefined)
    ? Buff.hex(iv, 16)
    : Buff.random(16)
  const encrypted = cbc(sbytes, vector).encrypt(cbytes)
  return new Buff(encrypted).base64 + '?iv=' + vector.base64
}

/**
 * Decrypts AES-CBC encrypted content using provided secret.
 * @param secret    Decryption key in hex format
 * @param content   Encrypted content in base64url format with IV
 * @returns         Decrypted content as string
 */
export function nip04_decrypt (
  secret  : string,
  content : string
) {
  const [ encryped, iv ] = content.split('?iv=')
  const cbytes = Buff.base64(encryped)
  const sbytes = Buff.hex(secret)
  const vector = Buff.base64(iv)
  const decrypted = cbc(sbytes, vector).decrypt(cbytes)
  return new Buff(decrypted).str
}

