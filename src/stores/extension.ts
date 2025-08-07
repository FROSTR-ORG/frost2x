import { useState, useEffect } from 'react'
import { NodeStore }     from './node.js'
import { SettingStore }   from './settings.js'
import { PermStore }      from './perms.js'

import type { WalletStore } from '@/types/wallet.js'

export interface ExtensionStore {
  settings    : SettingStore.Type
  node        : NodeStore.Type
  permissions : PermStore.Type
  wallet      : WalletStore
}

// Default wallet store state
const DEFAULT_WALLET: WalletStore = {
  account: null,
  address: null,
  balance: {
    confirmed: 0,
    unconfirmed: 0,
    total: 0
  },
  utxo_set: []
}

// Fetch all stores at once
/**
 * Fetches the extension store pieces concurrently.
 * Uses Promise.allSettled so that a failure in one source does not fail the entire load.
 * Falls back to each store's DEFAULT state when its fetch fails.
 */
export async function fetchExtensionStore(): Promise<ExtensionStore> {
  const [settingsRes, nodeRes, permissionsRes] = await Promise.allSettled([
    SettingStore.fetch(),
    NodeStore.fetch(),
    PermStore.fetch()
  ])

  const settings = settingsRes.status === 'fulfilled' ? settingsRes.value : SettingStore.DEFAULT
  const node = nodeRes.status === 'fulfilled' ? nodeRes.value : NodeStore.DEFAULT
  const permissions = permissionsRes.status === 'fulfilled' ? permissionsRes.value : PermStore.DEFAULT

  if (settingsRes.status === 'rejected' || nodeRes.status === 'rejected' || permissionsRes.status === 'rejected') {
    console.warn('[extension] one or more store fetches failed; using defaults where needed', {
      settingsError: settingsRes.status === 'rejected' ? settingsRes.reason : undefined,
      nodeError: nodeRes.status === 'rejected' ? nodeRes.reason : undefined,
      permissionsError: permissionsRes.status === 'rejected' ? permissionsRes.reason : undefined
    })
  }

  // TODO: Implement wallet store fetching when wallet functionality is added
  const wallet = DEFAULT_WALLET

  return { settings, node, permissions, wallet }
}

// Update extension store (for permissions)
export async function updateExtensionStore(updates: Partial<ExtensionStore>): Promise<void> {
  const promises: Promise<any>[] = []
  
  if (updates.settings) {
    promises.push(SettingStore.update(updates.settings))
  }
  
  if (updates.node) {
    promises.push(NodeStore.update(updates.node))
  }
  
  if (updates.permissions) {
    promises.push(PermStore.update(updates.permissions))
  }
  
  // TODO: Implement wallet store updating when wallet functionality is added
  
  await Promise.all(promises)
}

// React hook for using extension store
export function useExtensionStore() {
  const [store, setStore] = useState<ExtensionStore>({
    settings: SettingStore.DEFAULT,
    node: NodeStore.DEFAULT,
    permissions: PermStore.DEFAULT,
    wallet: DEFAULT_WALLET
  })

  useEffect(() => {
    let mounted = true

    // Initial fetch
    fetchExtensionStore()
      .then(newStore => {
        if (mounted) setStore(newStore)
      })
      .catch(console.error)
    
    // Subscribe to changes
    const unsubSettings = SettingStore.subscribe((settings) => {
      if (mounted) setStore(prev => ({ ...prev, settings }))
    })
    
    const unsubNode = NodeStore.subscribe((node) => {
      if (mounted) setStore(prev => ({ ...prev, node }))
    })
    
    const unsubPerms = PermStore.subscribe((permissions) => {
      if (mounted) setStore(prev => ({ ...prev, permissions }))
    })
    
    // TODO: Add wallet subscription when wallet store is implemented
    
    return () => {
      mounted = false
      try { unsubSettings() } catch (e) { console.error('Failed to unsubscribe from settings:', e) }
      try { unsubNode() } catch (e) { console.error('Failed to unsubscribe from node:', e) }
      try { unsubPerms() } catch (e) { console.error('Failed to unsubscribe from permissions:', e) }
    }
  }, [])

  // Return an object with the store and update function for backwards compatibility
  return {
    store,
    update: async (updates: Partial<ExtensionStore>) => {
      try {
        await updateExtensionStore(updates)
        // Local state will be updated through subscriptions
      } catch (error) {
        console.error('Failed to update extension store:', error)
        throw error
      }
    }
  }
}