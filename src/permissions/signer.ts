import { remove_reverse_policy } from './util.js'

import { 
  fetchExtensionStore,
  updateExtensionStore 
} from '../stores/extension.js'

import type {
  NostrEvent,
  SignerConditions
} from '../types/index.js'

export async function getSignerPermissionStatus (
  host   : string,
  type   : string,
  event? : NostrEvent
): Promise<boolean | null> {
  // Get the extension store.
  const store = await fetchExtensionStore()
  // Get the signer permissions.
  const perms = store.permissions.signer
  // Iterate over the permissions.
  for (const policy of perms) {
    // If the policy matches the host and type,
    if (policy.host === host && policy.type === type) {
      // If the type is signEvent,
      if (type === 'nostr.signEvent') {
        // If the event matches the conditions,
        if (event && match_event_conditions(policy.conditions, event)) {
          // Return the accept value.
          return policy.accept === 'true' ? true : false
        }
      } else {
        // Return the accept value.
        return policy.accept === 'true' ? true : false
      }
    }
  }
  return null
}

export async function updateSignerPermission (
  host       : string,
  type       : string,
  accept     : boolean,
  conditions : SignerConditions
) : Promise<void> {
  // Get the extension store.
  const store = await fetchExtensionStore()
  // Create a new array to avoid mutating the original
  const perms = [...store.permissions.signer]
  // Check if we already have a matching policy
  let policy_idx = perms.findIndex(policy => 
    policy.host === host && 
    policy.type === type && 
    policy.accept === String(accept)
  )
  // If we found an existing policy with same accept value,
  if (policy_idx >= 0) {
    // Create a copy of the policy before modifying
    const updated_policy = { 
      ...perms[policy_idx],
      conditions: JSON.parse(JSON.stringify(perms[policy_idx].conditions || {})),
      created_at: Math.round(Date.now() / 1000) 
    }
    // Merge conditions properly
    updated_policy.conditions = merge_conditions(updated_policy.conditions, conditions)
    // Update the policy.
    perms[policy_idx] = updated_policy
  // Else, we need to add a new policy.
  } else {
    // Remove the reverse policy if it exists.
    remove_reverse_policy(perms, host, type, accept)
    // Add new policy
    const new_policy = {
      host,
      type,
      accept     : String(accept),
      conditions : JSON.parse(JSON.stringify(conditions)),
      created_at : Math.round(Date.now() / 1000)
    }
    perms.push(new_policy)
  }
  // Update the extension store.
  updateExtensionStore({
    ...store,
    permissions: { ...store.permissions, signer: perms }
  })
}

function match_event_conditions (
  conditions : SignerConditions,
  event      : NostrEvent
): boolean {
  if (conditions?.kinds) {
    if (event.kind in conditions.kinds) return true
    else return false
  }
  return true
}

function merge_conditions (
  existingConditions : SignerConditions,
  newConditions      : SignerConditions
): SignerConditions {
  // Create a deep copy to avoid mutating the original
  const result: SignerConditions = JSON.parse(JSON.stringify(existingConditions || {}))
  // Merge kinds
  if (newConditions.kinds) {
    if (!result.kinds) {
      result.kinds = {}
    }
    Object.keys(newConditions.kinds).forEach(kind => {
      result.kinds![Number(kind)] = true
    })
  }
  // Merge other condition types here as needed
  // For example, if there are authors, tags, etc.
  return result
}

