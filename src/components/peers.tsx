import { usePeerStatus } from '@/hooks/usePeerStatus.js'

export function PeerInfo() {
  const { status, fetch_status } = usePeerStatus()

  return (
    <div className="container">
      <h2 className="section-header">Peer Status</h2>
      <div className="peer-table-wrapper">
        {status.length === 0 ? (
          <p className="peer-waiting">waiting for peers...</p>
        ) : (
          <table className="peer-table">
            <thead>
              <tr>
                <th>Pubkey</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {status.map((peer) => (
                <tr key={peer.pubkey}>
                  <td className="pubkey-cell">{peer.pubkey}</td>
                  <td>
                    <span
                      className={`status-indicator peer-status-badge ${peer.status === 'online' ? 'peer-online' : 'peer-offline'}`}
                    >
                      {peer.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button 
        className="button peer-refresh-btn" 
        onClick={fetch_status}
      >
        Refresh
      </button>
    </div>
  )
}
