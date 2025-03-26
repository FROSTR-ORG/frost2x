import { PermStore } from '@/stores/perms.js'

import {
  find_policy_idx,
  remove_reverse_policy
} from '@/lib/perms.js'

import type {
  NostrEvent,
  PolicyMethod,
  SignerPolicy,
  SignerPolicyConditions,
} from '@/types/index.js'

export async function get_signer_permission (
  host    : string,
  type    : string,
  params? : { event?: NostrEvent }
): Promise<boolean | null> {
  const perms = await PermStore.fetch().then(store => store.signer)
  // Iterate over the permissions.
  for (const policy of perms) {
    // If the policy matches the host and type,
    if (policy.host === host && policy.type === type) {
      // If the type is signEvent,
      if (type === 'nostr.signEvent' && params?.event) {
        // If the event has conditions set,
        if (policy.conditions) {
          // If the conditions have a kinds object,
          if (policy.conditions.kinds) {
            // If the event matches the conditions,
            if (match_event_conditions(policy.conditions, params.event)) {
              // Return the accept value.
              return policy.accept === 'true' ? true : false
            }
          } else {
            // Accept all is set for events.
            return policy.accept === 'true' ? true : false
          }
        }
      } else {
        // Accept all is set for non-signEvent requests.
        return policy.accept === 'true' ? true : false
      }
    }
  }
  // Return null if no policy matches the host and type.
  return null
}

export async function update_signer_permission (
  host        : string,
  type        : PolicyMethod,
  accept      : boolean,
  conditions? : SignerPolicyConditions
) : Promise<void> {
  // Create a new array to avoid mutating the original
  const perms = await PermStore.fetch().then(store => store.signer)
  // Check if we already have a matching policy
  const policy_idx = find_policy_idx(perms, host, type, accept)
  // If we found an existing policy with same accept value,
  if (policy_idx != -1) {
    const existing = perms[policy_idx]
    const updated  = update_policy(existing, conditions)
    // Update the policy.
    perms[policy_idx] = updated
  // Else, we need to add a new policy.
  } else {
    // Add new policy
    const policy : SignerPolicy = {
      host,
      type,
      conditions,
      accept     : accept ? 'true' : 'false',
      created_at : Math.round(Date.now() / 1000)
    }
    remove_reverse_policy(perms, policy)
    perms.push(policy)
  }
  // Update the policy store.
  return PermStore.update({ signer: perms }).then()
}

function match_event_conditions (
  conditions : SignerPolicyConditions,
  event      : NostrEvent
): boolean {
  // If there are kind conditions,
  if (conditions?.kinds) {
    // If the event kind is in the kinds object,
    const kind_policy = conditions.kinds[event.kind]
    if (kind_policy !== undefined) {
      // Return the value of the event kind in the kinds object.
      return kind_policy
    }
  }
  // Otherwise, return false.
  return false
}

function update_policy (
  policy      : SignerPolicy,
  conditions? : SignerPolicyConditions
): SignerPolicy {
  // Define the new conditions variable.
  let new_conditions : SignerPolicyConditions | undefined
  // If both the policy and the new conditions are defined,
  if (policy?.conditions !== undefined && conditions !== undefined) {
    // If the new conditions are empty,
    if (Object.keys(conditions).length === 0) {
      // Return the new conditions.
      new_conditions = conditions
    } else {  
      // Make a deep copy of the conditions.
      const copied = copy_conditions(policy?.conditions)
      // Merge conditions properly.
      new_conditions = merge_event_conditions(copied, conditions)
    }
    // Else, if only the policy has conditions,
  } else if (policy?.conditions !== undefined) {
    // Return the policy conditions.
    new_conditions = policy?.conditions
  } else {
    // Return undefined.
    new_conditions = undefined
  }
  // Return the updated policy.
  return {
    ...policy,
    conditions : new_conditions,
    created_at : Math.floor(Date.now() / 1000)
  }
}

function merge_event_conditions (
  curr : SignerPolicyConditions,
  next : SignerPolicyConditions
): SignerPolicyConditions {
  if (next.kinds !== undefined) {
    if (!curr.kinds) {
      curr.kinds = {}
    }
    Object.keys(next.kinds).forEach(kind => {
      curr.kinds![Number(kind)] = true
    })
  }
  return curr
}

function copy_conditions (
  conditions? : SignerPolicyConditions
): SignerPolicyConditions {
  return JSON.parse(JSON.stringify(conditions ?? {}))
}
