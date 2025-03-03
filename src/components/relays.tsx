import { useState, useEffect } from 'react'

import type { RelayPolicy } from '../types.js'

import useStore from './store.js'

export default function Relays() {
  const { store, update } = useStore()
  const [ relays, setRelays ] = useState<Array<RelayPolicy>>([])
  const [ newRelayURL, setNewRelayURL ] = useState('')

  useEffect(() => {
    if (store.relays) {
      setRelays([...store.relays])
    }
  }, [store.relays])

  const toggleReadRelay = (index: number) => {
    const updatedRelays = [...relays]
    updatedRelays[index] = {
      ...updatedRelays[index],
      read: !updatedRelays[index].read,
    }
    setRelays(updatedRelays)
  }

  const toggleWriteRelay = (index: number) => {
    const updatedRelays = [...relays]
    updatedRelays[index] = {
      ...updatedRelays[index],
      write: !updatedRelays[index].write,
    }
    setRelays(updatedRelays)
  }

  const deleteRelay = (index: number) => {
    const updatedRelays = [...relays]
    updatedRelays.splice(index, 1)
    setRelays(updatedRelays)
  }

  const saveRelays = () => {
    update({ relays })
  }

  const addNewRelay = () => {
    if (!newRelayURL) return
    
    let url = newRelayURL.trim()

    if (!(url.startsWith('ws://') || url.startsWith('wss://'))) {
      url = 'wss://' + url
    }
    
    setRelays([...relays, { url, read: true, write: true }])
    setNewRelayURL('')
  }

  return (
    <div className="container">
      <h2 className="section-header">Relay Connections</h2>
      <p className="description">Manage how you connect to the nostr network. "Read" means you will listen for incoming events from the relay, while "Write" means you will publish outgoing events to the relay.</p>
      
      <table>
        <thead>
          <tr>
            <th className="url-column">URL</th>
            <th className="checkbox-cell">Read</th>
            <th className="checkbox-cell">Write</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {relays.map((relay, index) => (
            <tr key={index} className="relay-row">
              <td>{relay.url}</td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  className="relay-checkbox"
                  checked={relay.read}
                  onChange={() => toggleReadRelay(index)}
                />
              </td>
              <td className="checkbox-cell">
                <input
                  type="checkbox"
                  className="relay-checkbox"
                  checked={relay.write}
                  onChange={() => toggleWriteRelay(index)}
                />
              </td>
              <td>
                <button
                  className="button"
                  onClick={() => deleteRelay(index)}
                >
                  delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="relay-controls">
        <div className="input-row">
          <input
            value={newRelayURL}
            placeholder="Enter relay URL"
            onChange={e => setNewRelayURL(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addNewRelay()
            }}
          />
          <button 
            disabled={!newRelayURL} 
            onClick={addNewRelay}
            className="button add-relay-button"
          >
            Add Relay
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={saveRelays}
            className="button button-primary save-button"
          >
            Save Relays
          </button>
        </div>
      </div>
    </div>
  )
} 