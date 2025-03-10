import { useExtensionStore } from '../../stores/extension.js'

interface AddressPermissionsProps {
  showMessage: (msg: string) => void;
}

export default function AddressPermissions({ 
  showMessage 
}: AddressPermissionsProps) {
  const { store, update } = useExtensionStore()

  const permissions = store.permissions.address

  async function handleRevoke(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    const { host, accept, xpub } = target.dataset
    const message = `revoke all ${accept === 'true' ? 'accept' : 'deny'} ${xpub} policies from ${host}?`
    if (window.confirm(message)) {
      const new_perms = permissions.filter(perm => (
        !(perm.host === host && perm.accept === accept && perm.xpub === xpub)
      ))
      update({ permissions: { ...store.permissions, address: new_perms } })
      showMessage(`removed address policy from ${host}`)
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Address Permissions</h2>
      <p className="description">Define a list of payment addresses for each domain, using an extended public key.</p>
      {!!permissions.length && (
        <table>
          <thead>
            <tr>
              <th>domain</th>
              <th>xpub</th>
              <th>policy</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(({ host, xpub, accept, created_at }) => (
              <tr key={host + xpub + accept}>
                <td>{host}</td>
                <td>{xpub}</td>
                <td>{accept === 'true' ? 'allow' : 'deny'}</td>
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
                    data-xpub={xpub}
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
          no address permissions have been set
        </div>
      )}
    </div>
  )
}