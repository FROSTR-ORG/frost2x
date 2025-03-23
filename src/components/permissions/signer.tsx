import { useEffect, useState } from 'react'
import { filter_policy }       from '@/lib/perms.js'
import { PermStore }           from '@/stores/perms.js'

import type { SignerPolicy } from '@/types/perm.js'

interface Props {
  store: PermStore.Type
}

export default function SignerPermissions({ store } : Props) {
  const [ table, setTable ]           = useState<SignerPolicy[]>(store.signer)
  const [ hostFilter, setHostFilter ] = useState<string>('')
  const [ typeFilter, setTypeFilter ] = useState<string>('')

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    const { host, accept, type } = target.dataset
    const message = `revoke all ${accept === 'true' ? 'accept' : 'deny'} ${type} policies from ${host}?`
    if (window.confirm(message)) {
      const perms  = filter_policy(table, host!, type!, accept!)
      const sorted = perms.sort((a, b) => b.created_at - a.created_at)
      PermStore.update({ signer: sorted })
      setTable(sorted)
    }
  }

  useEffect(() => {
    setTable(store.signer)
  }, [ store.signer ])

  const filteredTable = table.filter(policy => 
    policy.host.toLowerCase().includes(hostFilter.toLowerCase()) && 
    policy.type.toLowerCase().includes(typeFilter.toLowerCase())
  )

  return (
    <div className="container">
      <h2 className="section-header">Event Permissions</h2>
      <p className="description">Manage the event signing permissions granted to other websites.</p>
      
      {!!table.length && (
        <>
          <div className="filter-controls">
            <input 
              id="host-filter"
              type="text" 
              value={hostFilter} 
              onChange={(e) => setHostFilter(e.target.value)}
              placeholder="Filter by host" 
              className="filter-input"
            />
            <input 
              id="type-filter"
              type="text" 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              placeholder="Filter by type" 
              className="filter-input"
            />
          </div>

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
              {filteredTable.map(({ host, type, accept, conditions, created_at }) => (
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
        </>
      )}
      {!table.length && (
        <div className="description">
          no event permissions have been granted yet
        </div>
      )}
    </div>
  )
} 