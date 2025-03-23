import { useEffect, useState } from 'react'
import { filter_policy }       from '@/lib/perms.js'
import { PermStore }           from '@/stores/perms.js'

import type { SignerPolicy } from '@/types/perm.js'

export default function SignerPermissions() {
  const [ table, setTable ] = useState<SignerPolicy[]>([])
  const [ toast, setToast ] = useState<string | null>(null)

  useEffect(() => {
    PermStore.fetch().then(store => setTable(store.signer))
    const unsub = PermStore.subscribe(store => setTable(store.signer))
    return () => unsub()
  }, [])

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    const { host, accept, type } = target.dataset
    const message = `revoke all ${accept === 'true' ? 'accept' : 'deny'} ${type} policies from ${host}?`
    if (window.confirm(message)) {
      const new_perms = filter_policy(table, host!, type!, accept!)
      PermStore.update({ signer: new_perms })
      setTable(new_perms)
      setToast('removed policies')
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Event Permissions</h2>
      <p className="description">Manage the event signing permissions granted to other websites.</p>
      {!!table.length && (
        <table>
          <thead>
            <tr>
              <th>host</th>
              <th>type</th>
              <th>policy</th>
              <th>conditions</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {table.map(({ host, type, accept, conditions, created_at }) => (
              <tr key={host + type + accept + JSON.stringify(conditions)}>
                <td>{host}</td>
                <td>{type}</td>
                <td>{accept === 'true' ? 'allow' : 'deny'}</td>
                <td>
                  {conditions?.kinds
                    ? `kinds: ${Object.keys(conditions.kinds).join(', ')}`
                    : 'always'
                  }
                </td>
                <td>
                  {new Date(created_at * 1000)
                    .toISOString()
                    .split('.')[0]
                    .split('T')
                    .join(' ')}
                </td>
                <td>
                  <button
                    className="button"
                    onClick={handleRevoke}
                    data-host={host}
                    data-accept={accept}
                    data-type={type}
                  >
                    revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!table.length && (
        <div className="description">
          no event permissions have been granted yet
        </div>
      )}
    </div>
  )
} 