import { useEffect, useState } from 'react'
import { useExtensionStore }   from '../../stores/extension.js'

import type { NodeStore, RelayPolicy }   from '../../types/index.js'

export default function ({ update } : { update: (data: Partial<NodeStore>) => void }) {
  const { store } = useExtensionStore()
  const { node  } = store
  
  // Update to use the correct type
  const [ localState, setLocalState ] = useState<RelayPolicy[]>([])
  const [ hasChanges, setHasChanges ] = useState(false)
  const [ relayUrl, setRelayUrl ]     = useState('')
  const [ error, setError ]           = useState('')
  
  // Initialize local relays from store
  useEffect(() => {
    setLocalState(node.relays)
  }, [ node.relays ])
  
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
    setLocalState(prev => prev.filter((_, i) => i !== idx))
    setHasChanges(true)
  }
  
  // Save changes to the store
  const save = () => {
    update({ relays: localState })
    setHasChanges(false)
  }
  
  // Discard changes by resetting local state from store
  const cancel = () => {
    // Create a new array to ensure React detects the change
    setLocalState(node.relays)
    setHasChanges(false)
  }

  useEffect(() => {
    setRelays(store.relays)
  }, [ store.relays ])

  useEffect(() => {
    if (error !== null) setError(null)
  }, [ relayUrl ])
  
  return (
    <div className="container">
      <h2 className="section-header">Relay Connections</h2>
      <p className="description">Configure which relays your node will use to communicate. "Read" will enable listening for inbound requests, and "Write" will enable publishing outbound requests.</p>
      
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
        <div className="notification-container">
          {error && <p className="error-text">{error}</p>}
        </div>
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