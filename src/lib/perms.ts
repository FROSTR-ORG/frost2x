import type { BasePolicy } from '@/types/perm.js'

import * as CONST from '../const.js'

export function is_permission_required (
  key: string
): boolean {
  return !(
    key in CONST.PERMISSION_BYPASS &&
    CONST.PERMISSION_BYPASS[key]
  )
}

export function find_policy_idx (
  table  : BasePolicy[],
  host   : string,
  type   : string,
  accept : boolean
) : number {
  return table.findIndex(row => 
    row.host   === host   && 
    row.type   === type   && 
    row.accept === String(accept)
  )
}

export function filter_policy (
  table  : BasePolicy[],
  host   : string,
  type   : string,
  accept : string
) : BasePolicy[] {
  return table.filter(perm => (
    !(perm.host === host && perm.accept === accept && perm.type === type)
  ))
}

export function remove_reverse_policy (
  table  : BasePolicy[],
  policy : BasePolicy
) {
  // Check for reverse policy (accept/reject) that matches these conditions.
  const reverse_idx = table.findIndex(row => 
    row.host   === policy.host && 
    row.type   === policy.type &&
    row.accept === String(!policy.accept)
  )
  // Remove reverse policy if it exists.
  if (reverse_idx !== -1) {
    table.splice(reverse_idx, 1)
  }
}