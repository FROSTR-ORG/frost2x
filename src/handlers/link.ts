import { fetchExtensionStore } from '../stores/extension.js'

import * as nip19 from 'nostr-tools/nip19'

import type {
  ContentScriptMessage,
  EventPointer,
  Nip19Data,
  ProfilePointer
} from '../types/index.js'

export async function handleLinkRequest (msg : ContentScriptMessage) {
  const store = await fetchExtensionStore()
  
  const resolver_url = store.settings['links/resolver_url']

  if (!resolver_url) {
    return { error: { message: 'resolver URL not set' } }
  }

  let { url }   = msg.params
  let raw       = url.split('nostr:')[1]
  let decoded   = nip19.decode(raw) as Nip19Data
  let nip19Type = decoded.type
  let data      = decoded.data

  const typeMap = {
    npub     : { p_or_e: 'p', u_or_n: 'u' },
    note     : { p_or_e: 'e', u_or_n: 'n' },
    nprofile : { p_or_e: 'p', u_or_n: 'u' },
    nevent   : { p_or_e: 'e', u_or_n: 'n' },
    naddr    : { p_or_e: 'p', u_or_n: 'u' },
    nsec     : { p_or_e: 'p', u_or_n: 'u' }
  } as const

  const replacements = {
    raw,
    hrp: nip19Type,
    hex: (() => {
      if (nip19Type === 'npub' || nip19Type === 'note') return data as string
      if (nip19Type === 'nprofile') return (data as ProfilePointer).pubkey
      if (nip19Type === 'nevent') return (data as EventPointer).id
      return null
    })(),
    p_or_e: typeMap[nip19Type as keyof typeof typeMap]?.p_or_e ?? null,
    u_or_n: typeMap[nip19Type as keyof typeof typeMap]?.u_or_n ?? null,
    relay0: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[0] ?? null : null,
    relay1: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[1] ?? null : null,
    relay2: nip19Type === 'nprofile' ? (data as ProfilePointer).relays?.[2] ?? null : null
  }

  let result = resolver_url
  Object.entries(replacements).forEach(([pattern, value]) => {
    if (typeof result === 'string') {
      result = result.replace(new RegExp(`{ *${pattern} *}`, 'g'), value || '')
    }
  })

  return result
}
