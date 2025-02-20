import { useEffect, useState } from 'react'
import { decode_group_pkg, decode_share_pkg, get_pubkey }    from '@frostr/bifrost/lib'

import useStore from './store.js'
import { PeerEntry } from '../types.js'

export default function () {
  const { store, update }   = useStore()
  const [ peers, setPeers ] = useState<PeerEntry[] | null>(store.peers)

  useEffect(() => {
    if (peers === null && store.group !== null && store.share !== null) {
      if (store.peers !== null) {
        setPeers(store.peers)
      } else {
        const peers = init_peers(store.group, store.share)
        update({ peers })
        setPeers(peers)
      }
    }
  }, [ store ])

  useEffect(() => {
    if (store.group === null || store.share === null) {
      if (store.peers !== null) update({ peers: null })
      if (peers !== null)       setPeers(null)
    }
  }, [ store ])

  const togglePeerValue = (peerKey: string, field: 'send' | 'recv') => {
    if (!peers) return

    const newPeers : PeerEntry[] = peers.map(([key, value]) => {
      if (key === peerKey) {
        return [key, { ...value, [field]: !value[field] }]
      }
      return [key, value]
    })

    setPeers(newPeers)
    update({ peers: newPeers })
  }

  return (
    <div>
      <div>Peer Nodes</div>
      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {peers && peers.map(([key, { send, recv }]) => (
          <div key={key} style={{ 
            display: 'flex', 
            gap: '20px', 
            alignItems: 'baseline',
            padding: '4px 12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}>
            <div style={{ 
              width: '80px', 
              fontFamily: 'monospace',
              fontSize: '13px'
            }}>
              {key.slice(0, 8)}
            </div>
            <label style={{ 
              display: 'flex', 
              gap: '5px', 
              alignItems: 'center',
              color: '#555',
              fontSize: '13px'
            }}>
              <input
                type="checkbox"
                checked={send}
                onChange={() => togglePeerValue(key, 'send')}
                style={{ 
                  margin: 0,
                  position: 'relative',
                  top: '1px'
                }}
              />
              Send
            </label>
            <label style={{ 
              display: 'flex', 
              gap: '5px', 
              alignItems: 'center',
              color: '#555',
              fontSize: '13px'
            }}>
              <input
                type="checkbox"
                checked={recv}
                onChange={() => togglePeerValue(key, 'recv')}
                style={{ 
                  margin: 0,
                  position: 'relative',
                  top: '1px'
                }}
              />
              Receive
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

function init_peers(
  groupstr : string,
  sharestr : string
) : PeerEntry[] {
  const group  = decode_group_pkg(groupstr)
  const share  = decode_share_pkg(sharestr)
  const pubkey = get_pubkey(share.seckey, 'ecdsa')
  const peers  = group.commits.filter(commit => commit.pubkey !== pubkey)
  return peers.map((peer, idx) => 
    [ peer.pubkey.slice(2), { send: idx === 0, recv: false }] as PeerEntry
  )
}
