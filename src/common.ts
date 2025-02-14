import browser from 'webextension-polyfill'

export const NO_PERMISSIONS_REQUIRED = {
  replaceURL: true
}

export const PERMISSION_NAMES = Object.fromEntries([
  ['getPublicKey', 'read your public key'],
  ['getRelays', 'read your list of preferred relays'],
  ['signEvent', 'sign events using your private key'],
  ['nip04.encrypt', 'encrypt messages to peers'],
  ['nip04.decrypt', 'decrypt messages from peers'],
  ['nip44.encrypt', 'encrypt messages to peers'],
  ['nip44.decrypt', 'decrypt messages from peers']
])

interface NostrEvent {
  kind: number
  content: string
  tags: string[]
  [key: string]: any
}

interface Conditions {
  kinds?: Record<number, boolean>
  [key: string]: any
}

interface Policy {
  conditions: Conditions
  created_at: number
}

interface PolicyMap {
  [host: string]: {
    [accept: string]: {
      [type: string]: Policy
    }
  }
}

function matchConditions(conditions: Conditions, event: NostrEvent): boolean {
  if (conditions?.kinds) {
    if (event.kind in conditions.kinds) return true
    else return false
  }

  return true
}

export async function getPermissionStatus(
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

export async function updatePermission(
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

interface NotificationParams {
  event?: NostrEvent
  [key: string]: any
}

export async function showNotification(
  host: string,
  answer: boolean,
  type: string,
  params: NotificationParams
): Promise<void> {
  const {notifications} = await browser.storage.local.get('notifications') as {
    notifications?: boolean
  }
  if (notifications) {
    const action = answer ? 'allowed' : 'denied'
    await browser.notifications.create(undefined, {
      type: 'basic',
      title: `${type} ${action} for ${host}`,
      message: JSON.stringify(
        params?.event
          ? {
              kind: params.event.kind,
              content: params.event.content,
              tags: params.event.tags
            }
          : params,
        null,
        2
      ),
      iconUrl: 'icons/48x48.png'
    })
  }
}

export async function getPosition(
  width: number,
  height: number
): Promise<{top: number; left: number}> {
  let left = 0
  let top = 0

  try {
    const lastFocused = await browser.windows.getLastFocused() as browser.Windows.Window

    if (
      lastFocused &&
      lastFocused.top !== undefined &&
      lastFocused.left !== undefined &&
      lastFocused.width !== undefined &&
      lastFocused.height !== undefined
    ) {
      // Position window in the center of the lastFocused window
      top = Math.round(lastFocused.top + (lastFocused.height - height) / 2)
      left = Math.round(lastFocused.left + (lastFocused.width - width) / 2)
    } else {
      console.error('Last focused window properties are undefined.')
    }
  } catch (error) {
    console.error('Error getting window position:', error)
  }

  return {
    top,
    left
  }
}
