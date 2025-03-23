import { NodeStore } from '@/stores/node.js'

import { useEffect, useState } from 'react'

import type { RelayPolicy } from '@/types/index.js'

export default function () {
  const [ relays, setRelays ]   = useState<RelayPolicy[]>([])
  const [ relayUrl, setUrl ]    = useState('')
  const [ changes, setChanges ] = useState<boolean>(false)
  const [ error, setError ]     = useState<string | null>(null)
  const [ toast, setToast ]     = useState<string | null>(null)

  // Update the peer policies in the store.
  const update = () => {
    NodeStore.update({ relays })
    setChanges(false)
    setToast('relay policy updated')
  }

  // Discard changes by resetting local state from store
  const cancel = () => {
    NodeStore.fetch().then(store => setRelays(store.relays))
    setChanges(false)
  }
  
  // Update relay enabled status locally
  const update_relay = (idx: number, key: 'read' | 'write') => {
    setRelays(prev => {
      const updated = [...prev]
      updated[idx][key] = !updated[idx][key]
      return updated
    })
    setChanges(true)
  }
  
  // Add a new relay to local state
  const add_relay = () => {  
    if (!relayUrl.trim()) return
    
    if (!(relayUrl.startsWith('wss://') || relayUrl.startsWith('ws://'))) {
      setError('Relay URL must start with wss:// or ws://')
    } else if (!validateUrl(relayUrl)) {
      setError('Invalid URL format')
    } else if (relays.some(relay => relay.url === relayUrl)) {
      setError('Relay already exists')
    } else {
      setRelays(prev => [...prev, { url: relayUrl, read: true, write: true }])
      setUrl('')
      setChanges(true)
    }
  }
  
  // Remove a relay from local state
  const remove_relay = (idx: number) => {
    setRelays(prev => prev.filter((_, i) => i !== idx))
    setChanges(true)
  }

  // Fetch the peer policies from the store and subscribe to changes.
  useEffect(() => {
    NodeStore.fetch().then(store => setRelays(store.relays))
    const unsub = NodeStore.subscribe(store => setRelays(store.relays))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (error !== null) setError(null)
  }, [ relayUrl ])
  
  useEffect(() => {
    if (toast !== null) setTimeout(() => setToast(null), 3000)
  }, [ toast ])
  
  return (
    <div className="container">
      <h2 className="section-header">Relay Connections</h2>
      <p className="description">Configure which relays your node will use to communicate.</p>
      
      <table>
        <thead>
          <tr>
            <th className="url-column">Relay URL</th>
            <th className="checkbox-cell">Read</th>
            <th className="checkbox-cell">Write</th>
            <th className="action-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {relays.map((relay, idx) => (
            <tr key={idx}>
              <td>{relay.url}</td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  className="relay-checkbox"
                  checked={relay.read}
                  onChange={() => update_relay(idx, 'read')}
                />
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  className="relay-checkbox"
                  checked={relay.write}
                  onChange={() => update_relay(idx, 'write')}
                />
              </td>
              <td className="action-cell">
                <button 
                  onClick={() => remove_relay(idx)} 
                  className="button button-remove"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="input-group relay-controls">
        <input
          type="text"
          value={relayUrl}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="wss://relay.example.com"
          className="relay-input"
        />
        <button onClick={add_relay} className="button add-relay-button">
          Add Relay
        </button>
      </div>
      
      <div className="action-buttons">
        <button 
          onClick={update}
          disabled={!changes}
          className="button button-primary save-button"
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
        {toast && <p className="toast-text">{toast}</p>}
      </div>
    </div>
  )
}

function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}