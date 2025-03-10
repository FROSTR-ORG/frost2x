import { useExtensionStore } from '../../stores/extension.js';

interface EventPermissionsProps {
  showMessage: (msg: string) => void;
}

export default function EventPermissions({ showMessage } : EventPermissionsProps) {
  const { store, update } = useExtensionStore()

  const permissions = store.permissions.signer

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    const { host, accept, type } = target.dataset
    const message = `revoke all ${accept === 'true' ? 'accept' : 'deny'} ${type} policies from ${host}?`
    if (window.confirm(message)) {
      const new_perms = permissions.filter(perm => (
        !(perm.host === host && perm.accept === accept && perm.type === type)
      ))
      update({ permissions: { ...store.permissions, signer: new_perms } })
      showMessage('removed policies')
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Event Permissions</h2>
      <p className="description">Manage the event signing permissions granted to other websites.</p>
      {!!permissions.length && (
        <table>
          <thead>
            <tr>
              <th>domain</th>
              <th>action</th>
              <th>policy</th>
              <th>conditions</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(({ host, type, accept, conditions, created_at }) => (
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
      {!permissions.length && (
        <div className="description">
          no event permissions have been granted yet
        </div>
      )}
    </div>
  )
} 