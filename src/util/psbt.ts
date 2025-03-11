import { Buff }          from '@cmdcode/buff'
import { TxOpts }        from '@scure/btc-signer/transaction'

import {
  TaprootControlBlock,
  Transaction
} from '@scure/btc-signer'

import type {
  TransactionInput,
  TransactionOutput
} from '@scure/btc-signer/psbt'

type PSBTData = string | Transaction

/**
 * Takes a base64 string or PSBT object, returns a PSBT object.
 * @param psbt : PSBT object or base64 string.
 * @returns
 */
export function parse_psbt (psbt : PSBTData) : Transaction {
  if (psbt instanceof Transaction) {
    return psbt
  } else if (typeof psbt === 'string') {
    return decode_psbt(psbt)
  } else {
    throw new Error('invalid psbt: ' + psbt)
  }
}

/**
 * Decode a base64 string into a PSBT object.
 * @param b64str : PSBT data encoded as a base64 string.
 * @returns
 */
export function decode_psbt (b64str : string) : Transaction {
  const psbt = Buff.base64(b64str)
  return Transaction.fromPSBT(psbt, { allowUnknownOutputs: true })
}

/**
 * Encodes a PSBT object into a base64 string.
 * @param psbt : PSBT object.
 * @returns
 */
export function encode_psbt (psbt : Transaction) : string {
  const psbt_bytes = psbt.toPSBT(0)
  return new Buff(psbt_bytes).base64
}
