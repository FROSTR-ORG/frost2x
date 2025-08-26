import { Buff } from '@cmdcode/buff'

import { Transaction } from '@scure/btc-signer'

import type {
  TaprootControlBlock,
  TransactionInput,
  TransactionOutput
} from '@scure/btc-signer/psbt'

export type PSBTData   = Transaction
export type PSBTInput  = TransactionInput
export type PSBTOutput = TransactionOutput
export type PSBTCBlock = typeof TaprootControlBlock

export interface PSBTPrevouts {
  amounts : bigint[]
  scripts : Uint8Array[]
}

type WitnessUtxo = { amount: bigint, script: Uint8Array }

function isWitnessUtxo (value : unknown) : value is WitnessUtxo {
  if (value === null || typeof value !== 'object') return false
  const obj = value as { amount?: unknown, script?: unknown }
  return typeof obj.amount === 'bigint' && obj.script instanceof Uint8Array
}

/**
 * Takes a base64 string or PSBT object, returns a PSBT object.
 * @param psbt : PSBT object or base64 string.
 * @returns
 */
export function parse_psbt (
  psbt : PSBTData | string
) : Transaction {
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

export function get_prevouts (
  psbt : Transaction
) : PSBTPrevouts | null {
  const amounts : bigint[]     = []
  const scripts : Uint8Array[] = []
  const pdata = parse_psbt(psbt)
  for (let i = 0; i < pdata.inputsLength; i++) {
    const input   = pdata.getInput(i)
    const prevout = input.witnessUtxo
    if (prevout === undefined) return null
    if (!isWitnessUtxo(prevout)) throw new Error('invalid witnessUtxo at input ' + i)
    amounts.push(prevout.amount)
    scripts.push(prevout.script)
  }
  return { amounts, scripts }
}
