import { useEffect }  from 'react'
import { PeerPolicy } from '@frostr/bifrost'

import {
  decode_group_pkg,
  decode_share_pkg,
  get_pubkey
} from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {
  const { store, update } = useStore()

  useEffect(() => {
    if (store.peers === null) {
      if (store.group !== null && store.share !== null) {
        const peers = init_peers(store.group, store.share)
        update({ peers })
      }
    } else {
      if (store.group === null || store.share === null) {
        update({ peers: null })
      }
    }
  }, [store.peers, store.group, store.share, update])

  const togglePeerValue = (peerKey: string, field: 'send' | 'recv') => {
    if (store.peers === null) return

    const newPeers : PeerPolicy[] = store.peers.map(([ key, send, recv ]) => {
      if (key === peerKey && field === 'send') {
        return [ key, !send, recv ]
      } else if (key === peerKey && field === 'recv') {
        return [ key, send, !recv ]
      } else {
        return [ key, send, recv ]
      }
    })

    update({ peers: newPeers })
  }

  return (
    <div>
      <div>Peer Settings</div>
      <p>Manage how you communicate with other peers in your group. "Send" means you will consider those nodes when sending signature requests, while "Receive" means you will respond to signature requests from those nodes.</p>
      {store.peers === null && (<div>Please enter a group and share credential first.</div>)}
      <div
        style={{
          marginTop: '10px',
          marginLeft: '10px',
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {store.peers && store.peers.map(([ key, send, recv ]) => (
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
              send
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
              receive
            </label>
          </div>
        ))}
      </div>
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
