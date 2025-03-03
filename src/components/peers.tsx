import { useEffect } from 'react'

import useStore from './store.js'

import {
  decode_group_pkg,
  decode_share_pkg,
  get_pubkey
} from '@frostr/bifrost/lib'

import type { PeerPolicy } from '@frostr/bifrost'

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
    <div className="container">
      <h2 className="section-header">Peer Connections</h2>
      <p className="description">Manage how you connect with other peers in your group. "Request" means you will use those peers to request signatures, while "Respond" means you will respond to their requests.</p>

      {store.peers && store.peers.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th className="peer-index">Index</th>
              <th>Pubkey</th>
              <th className="checkbox-cell">Request</th>
              <th className="checkbox-cell">Respond</th>
            </tr>
          </thead>
          <tbody>
            {store.peers.map(([ key, send, recv ], idx) => (
              <tr key={key} className="peer-row">
                <td className="peer-index">{idx + 1}</td>
                <td className="peer-pubkey">{key}</td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={send}
                    onChange={() => togglePeerValue(key, 'send')}
                    className="peer-checkbox"
                  />
                </td>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    checked={recv}
                    onChange={() => togglePeerValue(key, 'recv')}
                    className="peer-checkbox"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="description">No peers available</div>
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