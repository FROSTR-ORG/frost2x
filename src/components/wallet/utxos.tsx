import { useUtxoSet }        from '../../hooks/explorer.js'
import { useExtensionStore } from '../../stores/extension.js'
import { useEffect }         from 'react'

interface Props {
  address     : string | null
  showMessage : (msg: string) => void
}

export default function Utxos({ address, showMessage }: Props) {
  const { data, isLoading, error } = useUtxoSet(address)
  
  const { store, update } = useExtensionStore()

  const link_url       = store.settings['explorer/link_url']
  const getExplorerUrl = (txid: string) => `${link_url}/tx/${txid}`
  const formatAmount   = (amount: number) => amount.toLocaleString()

  const group_pk = (store.node.group !== null)
    ? store.node.group.group_pk.slice(2)
    : null

  // Get current utxo_set from store or initialize if empty
  const utxo_map = new Map(store.wallet.utxo_set.map(utxo => (
    [ `${utxo.txid}:${utxo.vout}`, { ...utxo } ]
  )))

  // Sync UTXOs with store when data changes
  useEffect(() => {
    if (group_pk === null)  return
    if (data === undefined) return

    const new_map = new Map(utxo_map)
    
    // Update the store with new UTXO data
    data.forEach(utxo => {
      const outpoint = `${utxo.txid}:${utxo.vout}`
      const existing = new_map.get(outpoint)

      if (existing === undefined) {
        // If this UTXO doesn't exist in store, add it with selected=true
        new_map.set(outpoint, {
          script    : '5120' + group_pk,
          txid      : utxo.txid,
          vout      : utxo.vout,
          value     : utxo.value,
          confirmed : utxo.status.confirmed,
          selected  : true,
        })
      } else if (existing.confirmed !== utxo.status.confirmed) {
        new_map.set(outpoint, {
          ...existing,
          confirmed: utxo.status.confirmed
        })
      }
    })
    
    // Update the store
    const utxo_set = Array.from(new_map.values())
    update({ wallet: { ...store.wallet, utxo_set } })
  }, [ data, update ])

  // Handle checkbox change
  const handleUtxoSelectionChange = (
    txid     : string,
    vout     : number,
    selected : boolean
  ) => {
    const utxo_set = store.wallet.utxo_set
    const utxo     = utxo_set.find(utxo => (
      utxo.txid === txid && utxo.vout === vout
    ))
    
    if (utxo === undefined) return
    
    utxo.selected = selected
    update({ wallet: { ...store.wallet, utxo_set } })
  }

  return (
    <div className="utxo-section">
      <h3 className="settings-group-title">Unspent Coins ({data?.length || 0})</h3>
      
      {!data || data.length === 0 ? (
        <div className="empty-state">No unspent outputs available.</div>
      ) : (
        <div className="utxo-list">
          <table className="tx-table">
            <thead>
              <tr>
                <th></th>
                <th>Location</th>
                <th>Value (sats)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((utxo, index) => {
                const outpoint   = `${utxo.txid}:${utxo.vout}`
                const isSelected = utxo_map.get(outpoint)?.selected ?? true
                return (
                  <tr key={index}>
                    <td className="checkbox-cell">
                      <input 
                        type="checkbox" 
                        id={`utxo-${outpoint}`}
                        checked={isSelected}
                        onChange={(e) => handleUtxoSelectionChange(utxo.txid, utxo.vout, e.target.checked)}
                      />
                    </td>
                    <td>
                      <a 
                        href={getExplorerUrl(utxo.txid)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="txid-link"
                      >
                        {utxo.txid}:{utxo.vout}
                      </a>
                    </td>
                    <td>{formatAmount(utxo.value)}</td>
                    <td>{utxo.status.confirmed ? 'confirmed' : 'Unconfirmed'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {isLoading && <div className="loading-spinner">Loading coins...</div>}
      
      {error && (
        <div className="error-message">
          Failed to load unspent outputs: {error.message}
        </div>
      )}
    </div>
  )
} 