import browser from 'webextension-polyfill'

import * as nip19           from 'nostr-tools/nip19'
import { createRoot }       from 'react-dom/client'
import { decode_group_pkg } from '@frostr/bifrost/lib'

import {
  useState,
  useRef,
  useEffect,
  ReactElement
} from 'react'

import type { ExtensionStore } from './types/index.js'

function Popup() : ReactElement {
  let [ pubKey, setPubKey ]         = useState<string | null>('')
  let [ nodeStatus, setNodeStatus ] = useState<string>('stopped')

  let keys = useRef<string[]>([])

  useEffect(() => {
    browser.storage.sync.get(['store']).then((results: {
      store? : ExtensionStore
    }) => {
      if (typeof results.store?.node?.group === 'string') {
        const group = decode_group_pkg(results.store.node.group)
        let hexKey  = group.group_pk.slice(2)
        let npubKey = nip19.npubEncode(hexKey)

        setPubKey(npubKey)

        keys.current.push(npubKey)
        keys.current.push(hexKey)

        if (results.store?.node?.relays) {
          let relaysList: string[] = []
          for (let url in results.store.node.relays) {
            if (results.store.node.relays[url].write) {
              relaysList.push(url)
              if (relaysList.length >= 3) break
            }
          }
          if (relaysList.length) {
            let nprofileKey = nip19.nprofileEncode({
              pubkey: hexKey,
              relays: relaysList
            })
            keys.current.push(nprofileKey)
          }
        }
      } else {
        setPubKey(null)
      }
    })

    checkNodeStatus()
    
    const interval = setInterval(checkNodeStatus, 2500)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="popup-container">
      {/* Header with smaller logo */}
      <div className="popup-header">
        <img 
          src="icons/icon.png"
          alt="Frostr Logo" 
          className="frost-logo-small"
        />
        <div className="popup-title-container">
          <h2 className="popup-title">frost2x</h2>
          <div className="alpha-pill alpha-pill-small">ALPHA</div>
        </div>
      </div>

      { pubKey === null ? (
        <div className="popup-content">
          <p>No group package loaded.</p>
          <button onClick={openOptionsButton} className="button button-primary">Setup Node</button>
        </div>
      ) : (
        <div className="popup-content">
          <div className="key-container">
            <div className="key-header">
              <a onClick={toggleKeyType} className="key-toggle">↩️</a> 
              <span>Your public key:</span>
            </div>
            <pre className="key-display">
              <code>{pubKey}</code>
            </pre>
          </div>

          <div className="node-status-container">
            <span className="status-label">Node status: </span>
            <span className={`status-indicator status-${nodeStatus}`}>
              {nodeStatus}
            </span>
          </div>

          <div className="popup-actions">
            <button onClick={openOptionsButton} className="button button-secondary">
              Options
            </button>
            <button onClick={handleNodeReset} className="button button-warning">
              Restart Node
            </button>
          </div>
        </div>
      )}
    </div>
  )

  async function openOptionsButton() {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage()
    } else {
      window.open(browser.runtime.getURL('options.html'))
    }
  }

  function toggleKeyType(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    let nextKeyType =
      keys.current[(keys.current.indexOf(pubKey || '') + 1) % keys.current.length]
    setPubKey(nextKeyType)
  }

  async function checkNodeStatus() {
    try {
      const res = await browser.runtime.sendMessage({ type: 'get_node_status' }) as { status: string }
      setNodeStatus(res.status)
    } catch (error) {
      console.error('Error checking node status:', error)
      setNodeStatus('unknown')
    }
  }

  async function handleNodeReset() {
    try {
      // Immediately set status to restarting
      setNodeStatus('restarting');
      
      // Send the reset message to the background script
      browser.runtime.sendMessage({ type: 'node_reset' });
    } catch (error) {
      console.error('error resetting node:', error);
      // If there's an error, revert to 'unknown'
      setNodeStatus('unknown');
    }
  }
}

const container = document.getElementById('main')

if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}
