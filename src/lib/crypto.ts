import { Buff } from '@cmdcode/buff'
import { cbc }  from '@noble/ciphers/aes'

/**
 * Encrypts content using AES-CBC with an optional initialization vector.
 * @param secret    Encryption key in hex format
 * @param content   Content to encrypt
 * @param iv        Optional initialization vector in hex format
 * @returns         Encrypted content in base64url format with IV
 */
export function encrypt_content (
  secret  : string,
  content : string,
  iv?     : string
) {
  const cbytes = Buff.str(content)
  const sbytes = Buff.hex(secret)
  const vector = (iv !== undefined)
    ? Buff.hex(iv, 24)
    : Buff.random(24)
  const encrypted = cbc(sbytes, vector).encrypt(cbytes)
  return new Buff(encrypted).base64 + '?iv=' + vector.base64
}

/**
 * Decrypts AES-CBC encrypted content using provided secret.
 * @param secret    Decryption key in hex format
 * @param content   Encrypted content in base64url format with IV
 * @returns         Decrypted content as string
 */
export function decrypt_content (
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

