import { useAddressInfo } from '../../hooks/explorer.js'

interface Props {
  address     : string | null
  showMessage : (msg: string) => void
}

export default function ({ address, showMessage }: Props) {
  const { data, isLoading, error } = useAddressInfo(address)

  const chain_recv    = data?.chain_stats.funded_txo_sum   || 0
  const chain_send    = data?.chain_stats.spent_txo_sum    || 0
  const chain_balance = chain_recv - chain_send
  const pool_recv     = data?.mempool_stats.funded_txo_sum || 0
  const pool_send     = data?.mempool_stats.spent_txo_sum  || 0
  const pool_balance  = pool_recv - pool_send
  const total_balance = chain_balance + pool_balance

  return (
    <div className="wallet-balance-section">
      <h3 className="settings-group-title">Wallet Balance</h3>
      
      {error ? (
        <div className="error-message">
          Failed to load balance information: {error.message}
        </div>
      ) : (
        <div className="wallet-balance compact">
          <div className="balance-amount">
            <span className="total-amount">{total_balance}</span>
            <span className="unit">sats</span>
          </div>
          
          <div className="balance-details">
            <div className="balance-confirmed">
              <span className="balance-value">{chain_balance} confirmed</span>
            </div>
            
            {pool_balance > 0 && (
              <div className="balance-unconfirmed">
                <span className="balance-value">+{pool_balance} unconfirmed</span>
              </div>
            )}
          </div>
          
          {isLoading && <div className="loading-indicator">Updating...</div>}
        </div>
      )}
    </div>
  )
}
