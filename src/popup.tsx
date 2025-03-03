import browser from 'webextension-polyfill'
import QRCode  from 'react-qr-code'

import * as nip19           from 'nostr-tools/nip19'
import { createRoot }       from 'react-dom/client'
import { decode_group_pkg } from '@frostr/bifrost/lib'

import {
  useState,
  useRef,
  useEffect,
  ReactElement
} from 'react'

import type { ExtensionStore } from './types.js'

function Popup() : ReactElement {
  let [ pubKey, setPubKey ]         = useState<string | null>('')
  let [ nodeStatus, setNodeStatus ] = useState<string>('stopped')

  let keys = useRef<string[]>([])

  useEffect(() => {
    browser.storage.sync.get(['store']).then((results: {
      store? : ExtensionStore
    }) => {
      if (typeof results.store?.group === 'string') {
        const group = decode_group_pkg(results.store.group)
        let hexKey  = group.group_pk.slice(2)
        let npubKey = nip19.npubEncode(hexKey)

        setPubKey(npubKey)

        keys.current.push(npubKey)
        keys.current.push(hexKey)

        if (results.store?.relays) {
          let relaysList: string[] = []
          for (let url in results.store.relays) {
            if (results.store.relays[url].write) {
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
    <div style={{ marginBottom: '5px' }}>
      <h2>frost2x</h2>
      { pubKey === null ? (
        <div>
          <button onClick={openOptionsButton}>start here</button>
        </div>
      ) : (
        <>
          <p>
            <a onClick={toggleKeyType}>↩️</a> your public key:
          </p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              width: '200px'
            }}
          >
            <code>{pubKey}</code>
          </pre>

          <div style={{ marginBottom: '10px' }}>
            node status: <span style={{
              color: nodeStatus === 'running' ? 'green' : 
                     nodeStatus === 'stopped' ? 'red' : 'gray'
            }}>
              {nodeStatus}
            </span>
          </div>

          <button onClick={handleNodeReset}>
            reset
          </button>
        </>
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
      browser.runtime.sendMessage({ type: 'node_reset' });
    } catch (error) {
      console.error('error resetting node:', error);
    }
  }
}

const container = document.getElementById('main')

if (container) {
  const root = createRoot(container)
  root.render(<Popup />)
}
