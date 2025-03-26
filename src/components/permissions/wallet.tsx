import { useExtensionStore } from '../../stores/extension.js';

interface WalletPermissionProps {
  showMessage: (msg: string) => void;
}

export default function ({ showMessage }: WalletPermissionProps) {
  const { store, update } = useExtensionStore()

  const permissions = store.permissions.wallet

  async function handleRevokeWallet(e: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    const target = e.target as HTMLButtonElement
    let { host, accept, type } = target.dataset
    const message = `revoke all ${accept === 'true' ? 'accept' : 'deny'} wallet ${type} permissions from ${host}?`
    if (window.confirm(message)) {
      const new_perms = permissions.filter(perm => (
        !(perm.host === host && perm.accept === accept && perm.type === type)
      ))
      update({ permissions: { ...store.permissions, wallet: new_perms } })
      showMessage('removed wallet permissions')
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Wallet Permissions</h2>
      <p className="description">Manage the wallet access permissions granted to other websites.</p>
      {!!permissions.length && (
        <table>
          <thead>
            <tr>
              <th>domain</th>
              <th>action</th>
              <th>policy</th>
              <th>since</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(({ host, type, accept, created_at }) => (
              <tr key={host + type + accept}>
                <td>{host}</td>
                <td>{type}</td>
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
                    onClick={handleRevokeWallet}
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
          no wallet permissions have been granted yet
        </div>
      )}
    </div>
  )
}