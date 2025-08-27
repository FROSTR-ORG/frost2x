import { usePeerStatus } from '@/hooks/usePeerStatus.js'

export function PeerInfo() {
  const { status, ping_peer } = usePeerStatus()

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
                <th>Refresh</th>
              </tr>
            </thead>
            <tbody>
              {status.map((peer) => (
                <tr key={peer.pubkey}>
                  <td className="pubkey-cell">{peer.pubkey}</td>
                  <td>
                    <span
                      className={`status-indicator peer-status-badge peer-${peer.status}`}
                    >
                      {peer.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="button peer-refresh-btn" 
                      onClick={() => ping_peer(peer.pubkey)}
                    >
                      Refresh
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
