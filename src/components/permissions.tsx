import { useEffect, useState } from 'react'
import { removePermissions }   from '../lib/permissions.js'

import type { PublishPermissions } from '../types.js'

import browser from 'webextension-polyfill'

export default function PermissionConfig({ 
  showMessage 
}: { 
  showMessage: (msg: string) => void; 
}) {
  let [policies, setPermissions] = useState<PublishPermissions[]>([])

  useEffect(() => {
    loadPermissions()
  }, [])

  async function loadPermissions(): Promise<void> {
    let { policies = {} } = await browser.storage.local.get('policies')
    let list: PublishPermissions[] = []

    Object.entries(policies as Record<string, any>).forEach(([host, accepts]) => {
      Object.entries(accepts as Record<string, any>).forEach(([accept, types]) => {
        Object.entries(types as Record<string, any>).forEach(([type, data]) => {
          const { conditions, created_at } = data as { conditions: any, created_at: number }
          list.push({
            host,
            type,
            accept,
            conditions,
            created_at
          })
        })
      })
    })

    setPermissions(list)
  }

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    let { host, accept, type } = target.dataset
    if (
      window.confirm(
        `revoke all ${accept === 'true' ? 'accept' : 'deny'} ${type} policies from ${host}?`
      )
    ) {
      await removePermissions(host, accept, type)
      showMessage('removed policies')
      loadPermissions()
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Signing Permissions</h2>
      <p className="description">Manage the signing permissions granted to other websites.</p>
      {!!policies.length && (
        <table>
          <thead>
            <tr>
              <th>domain</th>
              <th>permission</th>
              <th>answer</th>
              <th>conditions</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {policies.map(({ host, type, accept, conditions, created_at }) => (
              <tr key={host + type + accept + JSON.stringify(conditions)}>
                <td>{host}</td>
                <td>{type}</td>
                <td>{accept === 'true' ? 'allow' : 'deny'}</td>
                <td>
                  {conditions.kinds
                    ? `kinds: ${Object.keys(conditions.kinds).join(', ')}`
                    : 'always'}
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
      {!policies.length && (
        <div className="description">
          no permissions have been granted yet
        </div>
      )}
    </div>
  )
}