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

const perms_schema = z.record(
  z.string(), 
  z.object({
    read  : z.boolean(),
    write : z.boolean()
  })
)

const store_schema = z.object({
  init   : z.boolean(),
  group  : z.string().nullable(),
  peers  : peers_schema.array().nullable(),
  share  : z.string().nullable()
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

  let perms : Record<string, { read: boolean, write: boolean }>,
      store : ExtensionStore

  try {
    const query = await browser.storage.sync.get(['store', 'relays'])
    perms = perms_schema.parse(query.relays)
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

  const relays = Object.entries(perms)
    .filter(([ _, perms ]) => perms.write)
    .map(([ url ]) => url)

  const node = new BifrostNode(group_pkg, share_pkg, relays, opt)

  node.client.on('ready', () => {
    console.log('background node connected')
  })

  node.client.on('message', (msg) => {
    console.log('received message event:', msg.env.id)
  })

  return node.connect()
}
