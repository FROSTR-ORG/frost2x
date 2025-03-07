import { useStore } from '../store.js'
import { usePoolHistory } from '../../hooks/explorer.js'

interface Props {
  address: string | null
  showMessage: (msg: string) => void
}

export default function MempoolTransactions({ address, showMessage }: Props) {
  const { data: poolTxs = [], isLoading, error } = usePoolHistory(address)
  const { 'explorer/link_url': link_url } = useStore().store.settings
  
  // Helper functions
  const getExplorerUrl = (txid: string) => `${link_url}/tx/${txid}`
  
  const formatAmount = (amount: number) => amount.toLocaleString()
  
  const calculateTxAmount = (tx: any): number => {
    if (!address) return 0
    
    let received = 0, sent = 0
    
    tx.vout?.forEach((output: any) => {
      if (output.scriptpubkey_address === address) {
        received += output.value
      }
    })
    
    tx.vin?.forEach((input: any) => {
      if (input.prevout?.scriptpubkey_address === address) {
        sent += input.prevout.value
      }
    })
    
    return received - sent
  }
  
  return (
    <div className="mempool-transactions">
      {error ? (
        <div className="error-message">
          Failed to load mempool transactions: {error.message}
        </div>
      ) : isLoading ? (
        <div className="loading-spinner">Loading mempool transactions...</div>
      ) : poolTxs.length > 0 ? (
        <div className="tx-list">
          <table className="tx-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Amount (sats)</th>
                <th>Fee (sats)</th>
                <th>Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {poolTxs.map(tx => {
                const amount = calculateTxAmount(tx)
                const fee = tx.fee || 0
                
                return (
                  <tr key={tx.txid} className={amount < 0 ? 'tx-sent' : 'tx-received'}>
                    <td>
                      <a href={getExplorerUrl(tx.txid)} target="_blank" 
                        rel="noopener noreferrer" className="txid-link">
                        {tx.txid}...
                      </a>
                    </td>
                    <td>{amount > 0 ? '+' : ''}{formatAmount(amount)}</td>
                    <td>{fee > 0 ? formatAmount(fee) : 'N/A'}</td>
                    <td>unconfirmed</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="no-tx-message">No pending transactions</p>
      )}
    </div>
  )
} 