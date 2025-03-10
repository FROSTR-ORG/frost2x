import * as CONST from '../const.js'

import type { BasePermission } from '../types/index.js'

export function is_permission_required (type: string): boolean {
  return !(type in CONST.PERMISSION_BYPASS && CONST.PERMISSION_BYPASS[type as keyof typeof CONST.PERMISSION_BYPASS])
}

export function remove_reverse_policy (
  perms  : BasePermission[],
  host   : string,
  type   : string,
  accept : boolean
) {
  // Check for reverse policy (accept/reject) that matches these conditions.
  const reverse_idx = perms.findIndex(policy => 
    policy.host   === host && 
    policy.type   === type &&
    policy.accept === String(!accept)
  )
  // Remove reverse policy if it exists.
  if (reverse_idx >= 0) {
    perms.splice(reverse_idx, 1)
  }
}