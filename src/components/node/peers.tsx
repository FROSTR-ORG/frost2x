import { useEffect, useState } from 'react'
import { NodeStore }           from '@/stores/node.js'

import type { PeerConfig } from '@frostr/bifrost'

// Helper to deep clone peers array to avoid reference mutations
function clonePeers(peers: PeerConfig[] | null): PeerConfig[] | null {
  if (peers === null) return null
  return peers.map(peer => ({
    pubkey: peer.pubkey,
    policy: { ...peer.policy }
  }))
}

export default function ({ store } : { store : NodeStore.Type }) {
  const [ peers, setPeers ]     = useState<PeerConfig[] | null>(clonePeers(store.peers))
  const [ changes, setChanges ] = useState<boolean>(false)
  const [ saved, setSaved ]     = useState<boolean>(false)

  // Update the peer policies in the store.
  const update = () => {
    NodeStore.update({ peers })
    setChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Discard changes by resetting local state from store
  const cancel = () => {
    setPeers(clonePeers(store.peers))
    setChanges(false)
  }

  // Update peer connectivity status locally
  const update_peer = (idx: number, key: 'send' | 'recv', value: boolean) => {
    setPeers(prev => {
      if (prev === null) return null
      // Deep clone to avoid mutations
      const updated = prev.map((peer, i) => {
        if (i === idx) {
          return {
            pubkey: peer.pubkey,
            policy: { ...peer.policy, [key]: value }
          }
        }
        return {
          pubkey: peer.pubkey,
          policy: { ...peer.policy }
        }
      })
      return updated
    })
    setChanges(true)
  }

  useEffect(() => {
    setPeers(clonePeers(store.peers))
    setChanges(false)
  }, [ store.peers ])

  return (
    <div className="container">
      <h2 className="section-header">Peer Connections</h2>
      <p className="description">Configure how you communicate with other peers in your signing group. "Request" will send signature requests to that peer, and "Respond" will co-sign requests from that peer.</p>

      {peers === null &&
        <p className="description">You must configure your node's credentials first.</p>
      }
      
      {peers !== null &&
        <div>
          <table>
            <thead>
              <tr>
                <th>Peer Public Key</th>
                <th className="checkbox-cell">Request</th>
                <th className="checkbox-cell">Respond</th>
              </tr>
            </thead>
            <tbody>
              {peers.map((peer, idx) => (
                <tr key={idx}>
                  <td className="pubkey-cell">{peer.pubkey}</td>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="peer-checkbox"
                      checked={peer.policy.send}
                      onChange={() => update_peer(idx, 'send', !peer.policy.send)}
                    />
                  </td>
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      className="peer-checkbox"
                      checked={peer.policy.recv}
                      onChange={() => update_peer(idx, 'recv', !peer.policy.recv)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="action-buttons">
            <button 
              onClick={update}
              disabled={!changes}
              className={`button button-primary action-button ${saved ? 'saved-button' : ''}`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
            
            {changes && (
              <button 
                onClick={cancel}
                className="button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      }
    </div>
  )
}
