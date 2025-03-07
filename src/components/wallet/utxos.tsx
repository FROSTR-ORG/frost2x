import { useUtxoSet } from '../../hooks/explorer.js'
import { useStore } from '../store.js'

interface Props {
  address     : string | null
  showMessage : (msg: string) => void
}

export default function Utxos({ address, showMessage }: Props) {
  const { data, isLoading } = useUtxoSet(address)
  
  const { 'explorer/link_url': link_url } = useStore().store.settings
  
  const getExplorerUrl = (txid: string) => `${link_url}/tx/${txid}`
  const formatAmount = (amount: number) => amount.toLocaleString()

  return (
    <div className="utxo-section">
      <h3 className="settings-group-title">Unspent Coins ({data?.length || 0})</h3>
      
      <div className="utxo-list">
        {isLoading ? (
          <div className="loading-spinner">Loading coins...</div>
        ) : data?.length ? (
          <table className="tx-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Value (sats)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((utxo) => {
                const outpoint = `${utxo.txid}:${utxo.vout}`
                return (
                  <tr key={outpoint}>
                    <td>
                      <a 
                        href={getExplorerUrl(utxo.txid)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="txid-link"
                      >
                        {outpoint}
                      </a>
                    </td>
                    <td>{formatAmount(utxo.value)}</td>
                    <td>{utxo.status.confirmed ? 'confirmed' : 'Unconfirmed'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No coins available. :-(</div>
        )}
      </div>
    </div>
  )
} 