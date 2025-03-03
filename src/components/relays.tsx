import { useEffect, useState } from 'react'

import useStore from './store.js'

// Add back the type import
import type { RelayPolicy } from '../types.js'

function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

export default function Relays() {
  const { store, update } = useStore()
  
  // Update to use the correct type
  const [ localState, setLocalState ] = useState<RelayPolicy[]>([])
  const [ hasChanges, setHasChanges ] = useState(false)
  const [ relayUrl, setRelayUrl ]     = useState('')
  const [ error, setError ]           = useState('')
  
  // Initialize local relays from store
  useEffect(() => {
    setLocalState(store.relays)
  }, [store.relays])
  
  // Update relay enabled status locally
  const update_relay = (idx: number, key: 'read' | 'write') => {
    setLocalState(prev => {
      const updated = [...prev]
      updated[idx][key] = !updated[idx][key]
      return updated
    })
    setHasChanges(true)
  }
  
  // Add a new relay to local state
  const add_relay = () => {  
    if (!relayUrl.trim()) {
      return
    }

    if (!(relayUrl.startsWith('wss://') || relayUrl.startsWith('ws://'))) {
      setError('Relay URL must start with wss:// or ws://')
      return
    }
    
    if (!validateUrl(relayUrl)) {
      setError('Invalid URL format')
      return
    }
    
    // Check if relay already exists
    if (localState.some(relay => relay.url === relayUrl)) {
      setError('Relay already exists')
      return
    }
    
    setLocalState(prev => [...prev, { url: relayUrl, read: true, write: true }])
    setRelayUrl('')
    setHasChanges(true)
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
    setLocalState(store.relays)
    setHasChanges(false)
  }
  
  return (
    <div className="container">
      <h2 className="section-header">Relay Configuration</h2>
      <p className="description">Configure which relays to connect to for key management.</p>
      
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
          {localState.map((relay, idx) => (
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
                <button onClick={() => remove_relay(idx)} className="button-danger">
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
          onChange={(e) => setRelayUrl(e.target.value)}
          placeholder="wss://relay.example.com"
          className="relay-input"
        />
        <button onClick={add_relay} className="button add-relay-button">
          Add Relay
        </button>
      </div>
      
      {error && <p className="error-text">{error}</p>}
      
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
  )
} 