import { useEffect, useState } from 'react'
import { useStore }            from './store.js'

import {
  decode_group_pkg,
  decode_share_pkg,
  get_pubkey
} from '@frostr/bifrost/lib'

import type { PeerPolicy } from '@frostr/bifrost'

export default function () {
  const { store, update } = useStore()
  
  // Add local state to track changes
  const [localPeers, setLocalPeers] = useState<PeerPolicy[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const has_creds = store.group !== null && store.share !== null

  // Initialize local state from store
  useEffect(() => {
    if (has_creds && store.peers === null) {
      update({ peers: init_peers() })
    } else if (!has_creds && store.peers !== null) {
      update({ peers: null })
    } else {
      setLocalPeers(store.peers ?? [])
    }
  }, [ has_creds, store.peers ])

  // Initialize peers from group and share data.
  const init_peers = () => {
    if (store.group === null || store.share === null) return []
    const group  = decode_group_pkg(store.group)
    const share  = decode_share_pkg(store.share)
    const pubkey = get_pubkey(share.seckey, 'ecdsa')
    const peers  = group.commits.filter(commit => commit.pubkey !== pubkey)
    return peers.map((peer, idx) => 
      [ peer.pubkey.slice(2), idx === 0, true ] as PeerPolicy
    )
  }
  
  // Update peer connectivity status locally
  const update_peer = (idx: number, key: number, value: boolean) => {
    setLocalPeers(prev => {
      const updated = [...prev]
      updated[idx][key] = value
      return updated
    })
    setHasChanges(true)
  }
  
  // Save changes to the store
  const save = () => {
    update({ peers: localPeers })
    setHasChanges(false)
  }
  
  // Discard changes by resetting local state from store
  const cancel = () => {
    setLocalPeers(store.peers ?? [])
    setHasChanges(false)
  }
  
  return (
    <div className="container">
      <h2 className="section-header">Peer Connections</h2>
      <p className="description">Configure connection settings for peers in your signing group.</p>

      {!has_creds &&
        <p className="description">Load a group package and a share package to configure peer connections.</p>
      }
      
      {has_creds && localPeers.length > 0 &&
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
              {localPeers.map((peer, idx) => (
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
              onClick={save}
              disabled={!hasChanges || !has_creds}
              className="button button-primary save-button"
            >
              Save
            </button>
            
            {hasChanges && (
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
