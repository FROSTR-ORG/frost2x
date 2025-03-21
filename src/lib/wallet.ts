import { bech32m } from '@scure/base'
import { Buff }    from '@cmdcode/buff'

import type { PSBTInput } from '../util/psbt.js'

import type {
  SighashVector,
  SignatureEntry
} from '@frostr/bifrost'

import type {
  ChainNetwork,
  Result,
  SighashConfig,
  SighashData,
  WalletSignMainifest,
  WalletStoreUtxo,
  WalletUtxo
} from '../types/index.js'

import * as CONST  from '../const.js'
import * as PSBT   from '../util/psbt.js'

const RANDOM_SORT = () => Math.random() > 0.5 ? 1 : -1

export function get_p2tr_address (
  pubkey  : string,
  network : ChainNetwork
) {
  const prefix = CONST.NETWORK_PREFIX[network]
  const bytes  = Buff.hex(pubkey)
  const words  = [ 1, ...bech32m.toWords(bytes) ]
  return bech32m.encode(prefix, words)
}

export function filter_utxos (utxos : WalletStoreUtxo[]) {
  return utxos
    .filter(utxo => utxo.confirmed && utxo.selected)
    .map(({ txid, vout, value, script }) => ({ txid, vout, value, script }))
}

export function select_utxos (
  utxos  : WalletUtxo[],
  amount : number,
  sorter = RANDOM_SORT
) : Result<WalletUtxo[]> {
  const selected : WalletUtxo[] = []

  let total = 0

  utxos.sort(sorter)

  for (const utxo of utxos) {
    selected.push(utxo)
    total += utxo.value
    if (total > amount + CONST.DUST_LIMIT) {
      return { ok: true, value: selected }
    }
  }

  return { ok: false, err: `insufficient sats: total(${total}) < amount(${amount}) + dust(${CONST.DUST_LIMIT})` }
}

export function get_utxo_balance (utxos : WalletUtxo[]) {
  return utxos.reduce((acc, utxo) => acc + utxo.value, 0)
}

export function get_psbt_sighashes (
  psbt     : string,
  manifest : WalletSignMainifest
) : Result<SighashData[]> {
  const pdata    = PSBT.parse_psbt(psbt)
  const prevouts = PSBT.get_prevouts(pdata)

  if (prevouts === null) {
    return { ok: false, err: 'prevouts missing' }
  }

  const sighashes : SighashData[] = []

  for (const [ pubkey, indexes ] of Object.entries(manifest)) {
    for (const config of indexes) {
      const idx  = (typeof config === 'object') ? config.index : config
      const opt  = (typeof config === 'object') ? config       : {}
      const txin = pdata.getInput(idx)

      if (!is_input_signable(txin)) {
        return { ok: false, err: `input is not signable: ${idx}` }
      }

      const hashes = get_input_sighashes(pdata, prevouts, idx, pubkey, opt)

      if (!hashes.ok) return hashes

      sighashes.push(...hashes.value)
    }
  }
  return { ok: true, value: sighashes }
}

function get_input_sighashes (
  pdata    : PSBT.PSBTData,
  prevouts : PSBT.PSBTPrevouts,
  index    : number,
  pubkey   : string,
  options  : Partial<SighashConfig>
) : Result<SighashData[]> {
  const { amounts, scripts } = prevouts
  const { code_sep, annex }  = options
  const sighashes : SighashData[] = []

  const txinput = pdata.getInput(index)
  const b_annex = annex !== undefined ? Buff.hex(annex) : undefined
  const sigtype = txinput.sighashType ?? 0x00

  // Script path spending.
  if (txinput.tapLeafScript !== undefined) {
    for (const tapleaf of txinput.tapLeafScript) {
      const [ ctrl, script ] = tapleaf

      if (!verify_cblock(ctrl, script)) {
        return { ok: false, err: `invalid control block on index: ${index}` }
      }

      const version = ctrl.version
      const sighash = pdata.preimageWitnessV1(index, scripts, sigtype, amounts, code_sep, script, ctrl.version, b_annex)
      const hash    = new Buff(sighash).hex
      sighashes.push({ index, hash, sigtype, type: 'script', version, tweak: null })
    }
  } else {
    const sighash = pdata.preimageWitnessV1(index, scripts, sigtype, amounts)
    const hash    = new Buff(sighash).hex
    const tweak   = get_taptweak(pubkey)
    sighashes.push({ index, hash, sigtype, type: 'key', version: 0, tweak })
  }

  return { ok: true, value: sighashes }
}

export function get_sighash_messages (
  sighashes : SighashData[]
) : SighashVector[] {
  return sighashes.map(({ hash, tweak }) => {
    const ret = [ hash ]
    if (tweak !== null) ret.push(tweak)
    return ret as SighashVector
  })
}

export function apply_psbt_sigs (
  psbt   : string | PSBT.PSBTData,
  hashes : SighashData[],
  sigs   : SignatureEntry[]
) : Result<string> {
  const pdata = PSBT.parse_psbt(psbt)

  for (const [ sighash, pubkey, sig ] of sigs) {
    // Find the sighash data.
    const hdata = hashes.find(h => h.hash === sighash)
    if (hdata === undefined) {
      return { ok: false, err: `sighash not found: ${sighash}` }
    }
    const { index, type, version } = hdata
    const txin = pdata.getInput(index)
    if (type === 'script') {
      const pubKey   = Buff.hex(pubkey)
      const leafHash = Buff.num(version, 1)
      txin.tapScriptSig = [
        ...(txin.tapScriptSig ?? []),
        [{ pubKey, leafHash }, Buff.hex(sig) ]
      ]
    } else if (type === 'key') {
      txin.tapKeySig = Buff.hex(sig)
    } else {
      return { ok: false, err: `unknown sighash type: ${type}` }
    }
  }
  return { ok: true, value: PSBT.encode_psbt(pdata) }
}

function is_input_signable (
  input : PSBTInput
) : boolean {
    // If the prevout is undefined, return false.
  if (input.witnessUtxo === undefined)         return false
  // If the input has a final script witness, return false.
  if (input.finalScriptWitness !== undefined)  return false
  // If the input has an existing signature, return false.
  if (input.tapKeySig !== undefined)           return false
  // If the prevout is not a p2tr script, return false.
  if (input.witnessUtxo.script.at(0) !== 0x51) return false
  // Input is signable.
  return true
}

function get_taptweak (pubkey : string) {
  return pubkey
}

function verify_cblock (
  cblock : any,
  script : Uint8Array
) {
  return false
}
