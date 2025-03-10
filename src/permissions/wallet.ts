import { updateExtensionStore }  from '../stores/extension.js'
import { remove_reverse_policy } from './util.js'

import type { ExtensionStore } from '../types/index.js'

export function getWalletPermissionStatus (
  store  : ExtensionStore,
  host   : string,
  type   : string
): boolean | null {
  const perms = store.permissions.wallet
  for (const policy of perms) {
    if (policy.host === host) {
      if (policy.type === type) {
        return policy.accept === 'true' ? true : false
      }
    }
  }
  return null
}

export function updateWalletPermission (
  store  : ExtensionStore,
  host   : string,
  type   : string,
  accept : boolean
) : void {
  const perms = store.permissions.wallet
  
  // Check if we already have a matching policy
  let policy_idx = perms.findIndex(policy => policy.host === host && policy.type === type)

  // If we found an existing policy, update or remove it
  if (policy_idx >= 0) {
    // If acceptance changed, replace the policy
    if (perms[policy_idx].accept !== String(accept)) {
      perms.splice(policy_idx, 1)
    }
    // Update timestamp
    perms[policy_idx].created_at = Math.round(Date.now() / 1000)
  } else {
    // Check for reverse policy (accept/reject) that matches these conditions.
    remove_reverse_policy(perms, host, type, accept)
    
    // Add new policy
    perms.push({
      host,
      type,
      accept     : String(accept),
      created_at : Math.round(Date.now() / 1000)
    })
  }

  updateExtensionStore({
    ...store,
    permissions: {
      ...store.permissions,
      wallet: perms
    }
  })
}