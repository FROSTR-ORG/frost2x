import { useState } from 'react'
import * as Icons from '../icons.js'
import { useAddressInfo } from '../../hooks/explorer.js'
import MempoolTransactions from './pooltx.js'
import ChainTransactions from './chaintx.js'

interface Props {
  address: string | null
  showMessage: (msg: string) => void
}

export default function Transactions({ address, showMessage }: Props) {
  const { data: addressInfo, isLoading } = useAddressInfo(address)
  
  // Extract stats for tab display
  const chainStats   = addressInfo?.chain_stats
  const mempoolStats = addressInfo?.mempool_stats
  
  // State for active tab - changed default to mempool
  const [ activeTxTab, setActiveTxTab ] = useState<'mempool' | 'on-chain'>('mempool')
  
  return (
    <div className="transaction-section">
      <h3 className="settings-group-title">Transactions</h3>
      
      {/* Tab Navigation */}
      <div className="tabs-nav-wrapper tx-nav-wrapper">
        <div className="tabs-navigation tx-navigation">
          <button 
            className={`tab-button ${activeTxTab === 'mempool' ? 'active' : ''}`}
            onClick={() => setActiveTxTab('mempool')}
          >
            <Icons.MempoolIcon />
            <span>Mempool ({mempoolStats?.tx_count || 0})</span>
          </button>
          <button 
            className={`tab-button ${activeTxTab === 'on-chain' ? 'active' : ''}`}
            onClick={() => setActiveTxTab('on-chain')}
          >
            <Icons.OnChainIcon />
            <span>On-chain ({chainStats?.tx_count || 0})</span>
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="tx-tab-content">
        {activeTxTab === 'mempool' && (
          <MempoolTransactions address={address} showMessage={showMessage} />
        )}
        
        {activeTxTab === 'on-chain' && (
          <ChainTransactions address={address} showMessage={showMessage} />
        )}
      </div>
    </div>
  )
} 