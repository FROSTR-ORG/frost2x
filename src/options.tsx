import { createRoot } from 'react-dom/client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import type { ReactElement } from 'react'

import GroupPackageConfig  from './components/group.js'
import PeerNodeConfig      from './components/peers.js'
import PermissionConfig    from './components/permissions.js'
import RelayConfig         from './components/relays.js'
import SecretPackageConfig from './components/share.js'
import ExtensionSettings   from './components/settings.js'

import useStore from './components/store.js'

function Options(): ReactElement {
  let [ messages, setMessages ]           = useState<string[]>([])
  let [warningMessage, setWarningMessage] = useState('')
  
  const { store, reset } = useStore()

  const showMessage = useCallback((msg: string) => {
    const newMessages = [...messages, msg ]
    setMessages(newMessages)
    setTimeout(() => setMessages([]), 3000)
  }, [messages])

  useEffect(() => {
    setTimeout(() => setWarningMessage(''), 5000)
  }, [warningMessage])

  return (
    <>
      {/* Toast notifications container - fixed at the top */}
      <div className="toast-container">
        {messages.map((message, i) => (
          <div key={i} className="toast-message">
            {message}
          </div>
        ))}
      </div>

      <div className="page-header">
        <h1>frost2x</h1>
        <p>frost signer extension</p>
      </div>

      <div className="options-container">
        <SecretPackageConfig />
        <GroupPackageConfig />

        {store.group && store.share && <PeerNodeConfig />}

        <RelayConfig />
        <ExtensionSettings showMessage={showMessage} />
      </div>
      
      <PermissionConfig showMessage={showMessage} />

      <h2 className="section-header">Danger Zone</h2>
      <p className="description">For development and testing. Use at your own risk!</p>
      <button 
        onClick={() => reset()} 
        className="reset-button"
      >
        reset store
      </button>
    </>
  )
}

const container = document.getElementById('main')
if (container) {
  const root = createRoot(container)
  root.render(<Options />)
}
