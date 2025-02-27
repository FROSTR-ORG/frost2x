import { useCallback, useEffect, useState } from 'react'
import browser from 'webextension-polyfill'
import { Relay } from '../types.js'

export default function RelayConfig({ 
  showMessage, 
  addUnsavedChanges 
}: { 
  showMessage: (msg: string) => void; 
  addUnsavedChanges: (section: string) => void;
}) {
  let [relays, setRelays] = useState<Relay[]>([])
  let [newRelayURL, setNewRelayURL] = useState('')

  useEffect(() => {
    browser.storage.sync
      .get(['relays'])
      .then(results => {
        if (results.relays) {
          let relaysList: Relay[] = []
          let resultsRelays = results.relays as Record<string, { read: boolean; write: boolean }>
          for (let url in resultsRelays) {
            relaysList.push({ url, policy: resultsRelays[url] })
          }
          setRelays(relaysList)
        }
      })
  }, [])

  function changeRelayURL(i: number, ev: React.ChangeEvent<HTMLInputElement>) {
    setRelays([
      ...relays.slice(0, i),
      { url: ev.target.value, policy: relays[i].policy },
      ...relays.slice(i + 1)
    ])
    addUnsavedChanges('relays')
  }

  function toggleRelayPolicy(i: number, cat: 'read' | 'write') {
    setRelays([
      ...relays.slice(0, i),
      {
        url: relays[i].url,
        policy: { ...relays[i].policy, [cat]: !relays[i].policy[cat] }
      },
      ...relays.slice(i + 1)
    ])
    addUnsavedChanges('relays')
  }

  function removeRelay(i: number) {
    setRelays([...relays.slice(0, i), ...relays.slice(i + 1)])
    addUnsavedChanges('relays')
  }

  function addNewRelay() {
    if (newRelayURL.trim() === '') return
    const newRelays = [...relays, {
      url: newRelayURL,
      policy: { read: true, write: true }
    }]
    setRelays(newRelays)
    addUnsavedChanges('relays')
    setNewRelayURL('')
  }

  async function saveRelays(): Promise<void> {
    await browser.storage.sync.set({
      relays: Object.fromEntries(
        relays
          .filter(({ url }) => url.trim() !== '')
          .map(({ url, policy }) => [url.trim(), policy])
      )
    })
    showMessage('saved relays!')
  }

  return (
    <div>
      <div>Relay Configuration</div>
      <p>Configure preferred relays for your extension:</p>
      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1px'
        }}
      >
        {relays.map(({ url, policy }, i) => (
          <div
            key={i}
            style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
          >
            <input
              style={{ width: '400px' }}
              value={url}
              onChange={changeRelayURL.bind(null, i)}
            />
            <div style={{ display: 'flex', gap: '5px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                read
                <input
                  type="checkbox"
                  checked={policy.read}
                  onChange={toggleRelayPolicy.bind(null, i, 'read')}
                />
              </label>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                write
                <input
                  type="checkbox"
                  checked={policy.write}
                  onChange={toggleRelayPolicy.bind(null, i, 'write')}
                />
              </label>
            </div>
            <button onClick={removeRelay.bind(null, i)}>remove</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <input
            style={{ width: '400px' }}
            value={newRelayURL}
            onChange={e => setNewRelayURL(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') addNewRelay()
            }}
          />
          <button disabled={!newRelayURL} onClick={addNewRelay}>
            add relay
          </button>
        </div>
      </div>
    </div>
  )
} 