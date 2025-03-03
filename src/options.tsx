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
import LinkSettings        from './components/settings/links.js'

import useStore from './components/store.js'

// Tab icons
const NodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4L20 8L12 12L4 8L12 4Z" />
    <path d="M4 8V16L12 20V12" />
    <path d="M20 8V16L12 20" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const PermissionsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

function Options(): ReactElement {
  let [ messages, setMessages ]           = useState<string[]>([])
  let [warningMessage, setWarningMessage] = useState('')
  let [activeTab, setActiveTab]           = useState('node')
  
  const { store, reset } = useStore()

  const showMessage = useCallback((msg: string) => {
    const newMessages = [...messages, msg ]
    setMessages(newMessages)
    setTimeout(() => setMessages([]), 3000)
  }, [ messages ])

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
        <img 
          src="icons/icon.png"
          alt="Frostr Logo" 
          className="frost-logo"
        />
        <h1>frost2x</h1>
        <p>frost signer extension</p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-navigation">
          <button 
            className={`tab-button ${activeTab === 'node' ? 'active' : ''}`}
            onClick={() => setActiveTab('node')}
          >
            <NodeIcon />
            <span>Node</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
            onClick={() => setActiveTab('permissions')}
          >
            <PermissionsIcon />
            <span>Permissions</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <SettingsIcon />
            <span>Settings</span>
          </button>
        </div>

        <div className="tab-content">
          {/* Node Tab */}
          {activeTab === 'node' && (
            <div className="tab-panel">
              <SecretPackageConfig />
              <GroupPackageConfig />
              {store.group && store.share && <PeerNodeConfig />}
              <RelayConfig />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-panel">
              <ExtensionSettings showMessage={showMessage} />
              
              <div className="container">
                <h2 className="section-header">Danger Zone</h2>
                <p className="description">For development and testing. Use at your own risk!</p>
                <button 
                  onClick={() => reset()} 
                  className="reset-button"
                >
                  reset store
                </button>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="tab-panel">
              <PermissionConfig showMessage={showMessage} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const container = document.getElementById('main')
if (container) {
  const root = createRoot(container)
  root.render(<Options />)
}
