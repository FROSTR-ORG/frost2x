import { useEffect, useState } from 'react'

import useStore from './store.js'

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
  
  // Initialize local state from store
  useEffect(() => {
    setLocalPeers(store.peers ?? [])
  }, [store.peers])
  
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
  
  if (!store.peers && (!store.group || !store.share)) {
    return (
      <div className="container">
        <h2 className="section-header">Peer Connections</h2>
        <p className="description">Configure connection settings for peers in your signing group.</p>
        <p className="description">Load a group package and a share package to configure peer connections.</p>
      </div>
    )
  }
  
  return (
    <div className="container">
      <h2 className="section-header">Peer Connections</h2>
      <p className="description">Configure connection settings for peers in your signing group.</p>
      
      {localPeers.length > 0 ? (
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
              disabled={!hasChanges}
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
      ) : (
        <p className="description">No peers found in the group package.</p>
      )}
    </div>
  )
}

function init_peers (
  groupstr : string,
  sharestr : string
) : PeerPolicy []{
  const group  = decode_group_pkg(groupstr)
  const share  = decode_share_pkg(sharestr)
  const pubkey = get_pubkey(share.seckey, 'ecdsa')
  const peers  = group.commits.filter(commit => commit.pubkey !== pubkey)
  return peers.map((peer, idx) => 
    [ peer.pubkey.slice(2), idx === 0, true ] as PeerPolicy
  )
} 