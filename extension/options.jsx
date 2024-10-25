import { useCallback, useEffect, useState } from 'react'
import { render } from 'react-dom'
import browser from 'webextension-polyfill'
import { removePermissions } from './common.js'

import GroupPackageConfig  from './components/group.js'
import SecretPackageConfig from './components/secret.js'
import SignerServerConfig  from './components/server.js'

function Options() {
  let [relays, setRelays] = useState([])
  let [newRelayURL, setNewRelayURL] = useState('')
  let [policies, setPermissions] = useState([])
  let [protocolHandler, setProtocolHandler] = useState('https://njump.me/{raw}')
  let [showNotifications, setNotifications] = useState(false)
  let [messages, setMessages] = useState([])
  let [handleNostrLinks, setHandleNostrLinks] = useState(false)
  let [showProtocolHandlerHelp, setShowProtocolHandlerHelp] = useState(false)
  let [unsavedChanges, setUnsavedChanges] = useState([])
  let [warningMessage, setWarningMessage] = useState('')

  const showMessage = useCallback((msg) => {
    messages.push(msg)
    setMessages(messages)
    setTimeout(() => setMessages([]), 3000)
  }, [])

  useEffect(() => {
    browser.storage.local
      .get(['relays', 'protocol_handler', 'notifications'])
      .then(results => {
        if (results.relays) {
          let relaysList = []
          for (let url in results.relays) {
            relaysList.push({
              url,
              policy: results.relays[url]
            })
          }
          setRelays(relaysList)
        }
        if (results.protocol_handler) {
          setProtocolHandler(results.protocol_handler)
          setHandleNostrLinks(true)
          setShowProtocolHandlerHelp(false)
        }
        if (results.notifications) {
          setNotifications(true)
        }
      })
  }, [])

  useEffect(() => {
    setTimeout(() => setWarningMessage(''), 5000)
  }, [warningMessage])

  useEffect(() => {
    loadPermissions()
  }, [])

  async function loadPermissions() {
    let { policies = {} } = await browser.storage.local.get('policies')
    let list = []

    Object.entries(policies).forEach(([host, accepts]) => {
      Object.entries(accepts).forEach(([accept, types]) => {
        Object.entries(types).forEach(([type, { conditions, created_at }]) => {
          list.push({
            host,
            type,
            accept,
            conditions,
            created_at
          })
        })
      })
    })

    setPermissions(list)
  }

  return (
    <>
      <h1 style={{ fontSize: '25px', marginBlockEnd: '0px' }}>frost2x</h1>
      <p style={{ marginBlockStart: '0px' }}>frost signer extension</p>
      <h2 style={{ marginBlockStart: '20px', marginBlockEnd: '5px' }}>options</h2>
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: 'fit-content'
        }}
      >
        <GroupPackageConfig  />
        <SecretPackageConfig />
        <SignerServerConfig  />

        <div>
          <div>preferred relays:</div>
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
        <div>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <div>
              handle{' '}
              <span style={{ padding: '2px', background: 'silver' }}>nostr:</span>{' '}
              links:
            </div>
            <input
              type="checkbox"
              checked={handleNostrLinks}
              onChange={changeHandleNostrLinks}
            />
          </label>
          <div style={{ marginLeft: '10px' }}>
            {handleNostrLinks && (
              <div>
                <div style={{ display: 'flex' }}>
                  <input
                    placeholder="url template"
                    value={protocolHandler}
                    onChange={handleChangeProtocolHandler}
                    style={{ width: '680px', maxWidth: '90%' }}
                  />
                  {!showProtocolHandlerHelp && (
                    <button onClick={changeShowProtocolHandlerHelp}>?</button>
                  )}
                </div>
                {showProtocolHandlerHelp && (
                  <pre>{`
    {raw} = anything after the colon, i.e. the full nip19 bech32 string
    {hex} = hex pubkey for npub or nprofile, hex event id for note or nevent
    {p_or_e} = "p" for npub or nprofile, "e" for note or nevent
    {u_or_n} = "u" for npub or nprofile, "n" for note or nevent
    {relay0} = first relay in a nprofile or nevent
    {relay1} = second relay in a nprofile or nevent
    {relay2} = third relay in a nprofile or nevent
    {hrp} = human-readable prefix of the nip19 string

    examples:
      - https://njump.me/{raw}
      - https://snort.social/{raw}
      - https://nostr.band/{raw}
                `}</pre>
                )}
              </div>
            )}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center' }}>
          show notifications when permissions are used:
          <input
            type="checkbox"
            checked={showNotifications}
            onChange={handleNotifications}
          />
        </label>
        <button
          disabled={!unsavedChanges.length}
          onClick={saveChanges}
          style={{ padding: '5px 20px' }}
        >
          save
        </button>
        <div style={{ fontSize: '120%' }}>
          {messages.map((message, i) => (
            <div key={i}>{message}</div>
          ))}
        </div>
      </div>
      <div>
        <h2>permissions</h2>
        {!!policies.length && (
          <table>
            <thead>
              <tr>
                <th>domain</th>
                <th>permission</th>
                <th>answer</th>
                <th>conditions</th>
                <th>since</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {policies.map(({ host, type, accept, conditions, created_at }) => (
                <tr key={host + type + accept + JSON.stringify(conditions)}>
                  <td>{host}</td>
                  <td>{type}</td>
                  <td>{accept === 'true' ? 'allow' : 'deny'}</td>
                  <td>
                    {conditions.kinds
                      ? `kinds: ${Object.keys(conditions.kinds).join(', ')}`
                      : 'always'}
                  </td>
                  <td>
                    {new Date(created_at * 1000)
                      .toISOString()
                      .split('.')[0]
                      .split('T')
                      .join(' ')}
                  </td>
                  <td>
                    <button
                      onClick={handleRevoke}
                      data-host={host}
                      data-accept={accept}
                      data-type={type}
                    >
                      revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!policies.length && (
          <div style={{ marginTop: '5px' }}>
            no permissions have been granted yet
          </div>
        )}
      </div>
    </>
  )

  function changeRelayURL(i, ev) {
    setRelays([
      ...relays.slice(0, i),
      { url: ev.target.value, policy: relays[i].policy },
      ...relays.slice(i + 1)
    ])
    addUnsavedChanges('relays')
  }

  function toggleRelayPolicy(i, cat) {
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

  function removeRelay(i) {
    setRelays([...relays.slice(0, i), ...relays.slice(i + 1)])
    addUnsavedChanges('relays')
  }

  function addNewRelay() {
    if (newRelayURL.trim() === '') return
    relays.push({
      url: newRelayURL,
      policy: { read: true, write: true }
    })
    setRelays(relays)
    addUnsavedChanges('relays')
    setNewRelayURL('')
  }

  async function handleRevoke(e) {
    let { host, accept, type } = e.target.dataset
    if (
      window.confirm(
        `revoke all ${accept === 'true' ? 'accept' : 'deny'
        } ${type} policies from ${host}?`
      )
    ) {
      await removePermissions(host, accept, type)
      showMessage('removed policies')
      loadPermissions()
    }
  }

  function handleNotifications() {
    setNotifications(!showNotifications)
    addUnsavedChanges('notifications')
    if (!showNotifications) requestBrowserNotificationPermissions()
  }

  async function requestBrowserNotificationPermissions() {
    let granted = await browser.permissions.request({
      permissions: ['notifications']
    })
    if (!granted) setNotifications(false)
  }

  async function saveNotifications() {
    await browser.storage.local.set({ notifications: showNotifications })
    showMessage('saved notifications!')
  }

  async function saveRelays() {
    await browser.storage.local.set({
      relays: Object.fromEntries(
        relays
          .filter(({ url }) => url.trim() !== '')
          .map(({ url, policy }) => [url.trim(), policy])
      )
    })
    showMessage('saved relays!')
  }

  function changeShowProtocolHandlerHelp() {
    setShowProtocolHandlerHelp(true)
  }

  function changeHandleNostrLinks() {
    if (handleNostrLinks) {
      setProtocolHandler('')
      addUnsavedChanges('protocol_handler')
    } else setShowProtocolHandlerHelp(true)
    setHandleNostrLinks(!handleNostrLinks)
  }

  function handleChangeProtocolHandler(e) {
    setProtocolHandler(e.target.value)
    addUnsavedChanges('protocol_handler')
  }

  async function saveNostrProtocolHandlerSettings() {
    await browser.storage.local.set({ protocol_handler: protocolHandler })
    showMessage('saved protocol handler!')
  }

  function addUnsavedChanges(section) {
    if (!unsavedChanges.find(s => s === section)) {
      unsavedChanges.push(section)
      setUnsavedChanges(unsavedChanges)
    }
  }

  async function saveChanges() {
    for (let section of unsavedChanges) {
      switch (section) {
        case 'relays':
          await saveRelays()
          break
        case 'protocol_handler':
          await saveNostrProtocolHandlerSettings()
          break
        case 'notifications':
          await saveNotifications()
          break
      }
    }
    setUnsavedChanges([])
  }
}

render(<Options />, document.getElementById('main'))
