import browser from 'webextension-polyfill'

import type { Conditions, NostrEvent, PolicyMap } from '../types/index.js'

import * as CONST from '../const.js'

export function is_permission_required (type: string): boolean {
  return !(type in CONST.PERMISSION_BYPASS && CONST.PERMISSION_BYPASS[type as keyof typeof CONST.PERMISSION_BYPASS])
}

function matchConditions (conditions: Conditions, event: NostrEvent): boolean {
  if (conditions?.kinds) {
    if (event.kind in conditions.kinds) return true
    else return false
  }

  return true
}

export async function getPermissionStatus (
  host: string,
  type: string,
  event: NostrEvent
): Promise<boolean | undefined> {
  const {policies} = await browser.storage.local.get('policies') as {
    policies: PolicyMap
  }

  let answers = [true, false]
  for (let i = 0; i < answers.length; i++) {
    let accept = answers[i]
    let {conditions} = (policies?.[host]?.[String(accept)]?.[type] || {}) as {
      conditions?: Conditions
    }

    if (conditions) {
      if (type === 'signEvent') {
        if (matchConditions(conditions, event)) {
          return accept // may be true or false
        } else {
          // if this doesn't match we just continue so it will either match for the opposite answer (reject)
          // or it will end up returning undefined at the end
          continue
        }
      } else {
        return accept // may be true or false
      }
    }
  }

  return undefined
}

export async function updatePermission (
  host: string,
  type: string,
  accept: boolean,
  conditions: Conditions
): Promise<void> {
  const {policies = {}} = (await browser.storage.local.get(
    'policies'
  )) as {
    policies: PolicyMap
  }

  // if the new conditions is "match everything", override the previous
  if (Object.keys(conditions).length === 0) {
    conditions = {}
  } else {
    // if we already had a policy for this, merge the conditions
    let existingConditions = policies[host]?.[String(accept)]?.[type]?.conditions
    if (existingConditions) {
      if (existingConditions.kinds && conditions.kinds) {
        Object.keys(existingConditions.kinds).forEach(kind => {
          if (conditions.kinds) conditions.kinds[Number(kind)] = true
        })
      }
    }
  }

  // if we have a reverse policy (accept / reject) that is exactly equal to this, remove it
  const other = !accept
  const reverse = policies?.[host]?.[String(other)]?.[type]
  if (
    reverse &&
    JSON.stringify(reverse.conditions) === JSON.stringify(conditions)
  ) {
    delete policies[host][String(other)][type]
  }

  // insert our new policy
  policies[host] = policies[host] || {}
  policies[host][String(accept)] = policies[host][String(accept)] || {}
  policies[host][String(accept)][type] = {
    conditions, // filter that must match the event (in case of signEvent)
    created_at: Math.round(Date.now() / 1000)
  }

  await browser.storage.local.set({policies})
}

export async function removePermissions(
  host   : string  = 'undefined',
  accept : string  = 'undefined',
  type   : string  = 'undefined'
): Promise<void> {
  const { policies = {} } = (await browser.storage.local.get('policies')) as { policies: PolicyMap }
  delete policies[host]?.[accept]?.[type]
  await browser.storage.local.set({policies})
}
