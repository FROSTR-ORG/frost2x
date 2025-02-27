import browser from 'webextension-polyfill'
import React   from 'react'

import { createRoot } from 'react-dom/client'

import {
  ReactElement,
  useCallback,
  useEffect,
  useState
} from 'react'

import GroupPackageConfig  from './components/group.js'
import SecretPackageConfig from './components/share.js'
import SignerServerConfig  from './components/peers.js'
import RelayConfig         from './components/relays.js'
import PermissionConfig    from './components/permissions.js'

import useStore from './components/store.js'

function Options(): ReactElement {
  let [protocolHandler, setProtocolHandler] = useState('https://njump.me/{raw}')
  let [showNotifications, setNotifications] = useState(false)
  let [messages, setMessages] = useState<string[]>([])
  let [handleNostrLinks, setHandleNostrLinks] = useState(false)
  let [showProtocolHandlerHelp, setShowProtocolHandlerHelp] = useState(false)
  let [unsavedChanges, setUnsavedChanges] = useState<string[]>([])
  let [warningMessage, setWarningMessage] = useState('')
  
  const { reset } = useStore()

  const showMessage = useCallback((msg: string) => {
    const newMessages = [...messages, msg]
    setMessages(newMessages)
    setTimeout(() => setMessages([]), 3000)
  }, [messages])

  useEffect(() => {
    browser.storage.sync
      .get(['protocol_handler', 'notifications'])
      .then(results => {
        if (results.protocol_handler) {
          setProtocolHandler(results.protocol_handler as string)
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

  function addUnsavedChanges(section: string) {
    if (!unsavedChanges.find(s => s === section)) {
      const newChanges = [...unsavedChanges, section]
      setUnsavedChanges(newChanges)
    }
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

  function handleChangeProtocolHandler(e: React.ChangeEvent<HTMLInputElement>) {
    setProtocolHandler(e.target.value)
    addUnsavedChanges('protocol_handler')
  }

  function handleNotifications() {
    setNotifications(!showNotifications)
    addUnsavedChanges('notifications')
    if (!showNotifications) requestBrowserNotificationPermissions()
  }

  async function requestBrowserNotificationPermissions(): Promise<void> {
    let granted = await browser.permissions.request({
      permissions: ['notifications']
    })
    if (!granted) setNotifications(false)
  }

  async function saveNotifications(): Promise<void> {
    await browser.storage.local.set({ notifications: showNotifications })
    showMessage('saved notifications!')
  }

  async function saveNostrProtocolHandlerSettings(): Promise<void> {
    await browser.storage.local.set({ protocol_handler: protocolHandler })
    showMessage('saved protocol handler!')
  }

  async function saveChanges(): Promise<void> {
    for (let section of unsavedChanges) {
      switch (section) {
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
        <RelayConfig showMessage={showMessage} addUnsavedChanges={addUnsavedChanges} />

        <div>
          <div>Nostr Protocol Handler</div>
          <p>Configure how nostr: links are handled:</p>
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
      
      <PermissionConfig showMessage={showMessage} />
      
      <button onClick={() => reset()}>reset store</button>
    </>
  )
}

const container = document.getElementById('main')
if (container) {
  const root = createRoot(container)
  root.render(<Options />)
}
