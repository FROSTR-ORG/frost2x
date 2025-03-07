import { useState } from 'react'
import { useStore } from '../store.js'
import { useChainHistory } from '../../hooks/explorer.js'

interface Props {
  address: string | null
  showMessage: (msg: string) => void
}

export default function ChainTransactions({ address, showMessage }: Props) {
  const { data: chainTxs = [], isLoading, error } = useChainHistory(address)
  const { 'explorer/link_url': link_url } = useStore().store.settings
  
  // State for pagination
  const [txPage, setTxPage] = useState(1)
  
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
    <div className="chain-transactions">
      {error ? (
        <div className="error-message">
          Failed to load on-chain transactions: {error.message}
        </div>
      ) : isLoading ? (
        <div className="loading-spinner">Loading on-chain transactions...</div>
      ) : chainTxs.length > 0 ? (
        <>
          <div className="tx-list">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Amount (sats)</th>
                  <th>Fee (sats)</th>
                  <th>Block Height</th>
                </tr>
              </thead>
              <tbody>
                {chainTxs
                  .slice((txPage - 1) * 5, txPage * 5)
                  .map(tx => {
                    const amount = calculateTxAmount(tx)
                    const fee    = tx.fee || 0
                    const height = (tx.status?.block_height)
                      ? `${tx.status.block_height}`
                      : 'unconfirmed'
                    
                    return (
                      <tr key={tx.txid} className={amount < 0 ? 'tx-sent' : 'tx-received'}>
                        <td>
                          <a href={getExplorerUrl(tx.txid)} target="_blank" 
                            rel="noopener noreferrer" className="txid-link">
                            {tx.txid.substring(0, 8)}...
                          </a>
                        </td>
                        <td>{amount > 0 ? '+' : ''}{formatAmount(amount)}</td>
                        <td>{fee > 0 ? formatAmount(fee) : 'N/A'}</td>
                        <td>{height}</td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {chainTxs.length > 5 && (
            <div className="pagination">
              <button 
                onClick={() => setTxPage(Math.max(1, txPage - 1))} 
                disabled={txPage <= 1}
                className="pagination-button"
              >
                &laquo; Previous
              </button>
              <span className="page-info">
                Page {txPage} of {Math.ceil(chainTxs.length / 5)}
              </span>
              <button 
                onClick={() => setTxPage(Math.min(Math.ceil(chainTxs.length / 5), txPage + 1))} 
                disabled={txPage >= Math.ceil(chainTxs.length / 5)}
                className="pagination-button"
              >
                Next &raquo;
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="no-tx-message">No confirmed transactions</p>
      )}
    </div>
  )
} 