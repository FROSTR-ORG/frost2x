import { z }           from 'zod'
import { BifrostNode } from '@frostr/bifrost'

import {
  decode_share_pkg,
  decode_group_pkg
} from '@frostr/bifrost/lib'

import type {
  BifrostNodeConfig,
  GroupPackage,
  SharePackage
} from '@frostr/bifrost'

import type { ExtensionStore } from '../types.js'

import browser from 'webextension-polyfill'

const peers_schema = z.tuple([
  z.string(), 
  z.boolean(),
  z.boolean()
])

const relay_schema = z.object({
  url   : z.string(),
  read  : z.boolean(),
  write : z.boolean()
})

const settings_schema = z.object({
  'general/show_notifications' : z.boolean(),
  'links/is_active'            : z.boolean(),
  'links/resolver_url'         : z.string().nullable()
})

const store_schema = z.object({
  group    : z.string().nullable(),
  peers    : peers_schema.array().nullable(),
  relays   : relay_schema.array(),
  share    : z.string().nullable(),
  settings : settings_schema
})

export async function keep_alive (
  node : BifrostNode | null
) : Promise<BifrostNode | null> {
  if (node === null) {
    return init_node()
  }
  return node
}

export async function init_node () : Promise<BifrostNode | null> {

  let store : ExtensionStore

  try {
    const query = await browser.storage.sync.get(['store'])
    store = store_schema.parse(query.store)
  } catch (err) {
    console.error('failed to fetch data from storage')
    console.error(err)
    return null
  }

  const { group, peers, share } = store

  if (group === null || peers === null || share === null) {
    console.error('extension store is missing required fields')
    return null
  }

  let group_pkg : GroupPackage,
      share_pkg : SharePackage

  try {
    group_pkg = decode_group_pkg(group)
    share_pkg = decode_share_pkg(share)
  } catch (err) {
    console.error('failed to decode package data')
    console.error(err)
    return null
  }

  const opt : Partial<BifrostNodeConfig> = {
    policies : store.peers ?? []
  }

  const relay_urls = store.relays
    .filter((relay) => relay.write)
    .map((relay) => relay.url)

  const node = new BifrostNode(group_pkg, share_pkg, relay_urls, opt)

  node.client.on('ready', () => {
    console.log('background node connected')
  })

  node.client.on('message', (msg) => {
    console.log('received message event:', msg.env.id)
  })

  return node.connect()
}
