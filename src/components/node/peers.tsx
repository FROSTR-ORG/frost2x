import { NodeStore }  from '@/stores/node.js'
import { get_pubkey } from '@frostr/bifrost/lib'

import { useEffect, useState } from 'react'

import type { PeerPolicy } from '@frostr/bifrost'

export default function () {
  const [ peers, setPeers ]     = useState<PeerPolicy[] | null>(null)
  const [ changes, setChanges ] = useState<boolean>(false)
  const [ toast, setToast ]     = useState<string | null>(null)

  // Update the peer policies in the store.
  const update = () => {
    NodeStore.update({ peers })
    setChanges(false)
    setToast('peering policy updated')
  }

  // Discard changes by resetting local state from store
  const cancel = () => {
    NodeStore.fetch().then(store => setPeers(store.peers))
    setChanges(false)
  }

  // Update peer connectivity status locally
  const update_peer = (idx: number, key: number, value: boolean) => {
    setPeers(prev => {
      const updated = [ ...prev ?? [] ]
      updated[idx][key] = value
      return updated
    })
    setChanges(true)
  }

  // Fetch the peer policies from the store and subscribe to changes.
  useEffect(() => {
    NodeStore.fetch().then(store => setPeers(store.peers))
    const unsub = NodeStore.subscribe(store => setPeers(store.peers))
    return () => unsub()
  }, [])
  
  useEffect(() => {
    if (toast !== null) setTimeout(() => setToast(null), 3000)
  }, [ toast ])

  return (
    <div className="container">
      <h2 className="section-header">Peer Connections</h2>
      <p className="description">Configure your connection to other nodes in your signing group.</p>

      {!has_creds &&
        <p className="description">You must configure your node's credentials.</p>
      }
      
      {peers !== null &&
        <div>
          <table>
            <thead>
              <tr>
                <th>Pubkey</th>
                <th className="checkbox-cell">Request</th>
                <th className="checkbox-cell">Respond</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer, idx) => (
                <tr key={idx}>
                  <td className="pubkey-cell">{peer[0]}</td>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="peer-checkbox"
                      checked={peer[1]}
                      onChange={() => update_peer(idx, 1, !peer[1])}
                    />
                  </td>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="peer-checkbox"
                      checked={peer[2]}
                      onChange={() => update_peer(idx, 2, !peer[2])}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="action-buttons">
            <button 
              onClick={update}
              disabled={!changes || !has_creds}
              className="button button-primary save-button"
            >
              Save
            </button>
            
            {changes && (
              <button 
                onClick={cancel}
                className="button"
              >
                Cancel
              </button>
            )}
            {toast && <p className="toast-text">{toast}</p>}
          </div>
        </div>
      }
    </div>
  )
}

function has_creds (store : NodeStore.Type) {
  return (store.group !== null && store.share !== null)
}

function has_peers (store : NodeStore.Type) {
  return (
    store.group !== null &&
    store.peers !== null &&
    store.peers.length === store.group.commits.length - 1
  )
}

function is_diff (
  peers : PeerPolicy[] | null,
  store : PeerPolicy[] | null
) {
  return JSON.stringify(peers ?? {}) !== JSON.stringify(store ?? {})
}
