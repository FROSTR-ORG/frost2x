import { createRoot } from 'react-dom/client'

import {
  useCallback,
  useEffect,
  useState
} from 'react'

import type { ReactElement } from 'react'

import * as Icons from './components/icons.js'

import Console     from './components/console.js'
import Node        from './components/node.js'
import Permissions from './components/permissions.js'
import Settings    from './components/settings.js'
import Wallet      from './components/wallet.js'

import { StoreProvider } from './components/store.js'

function Options(): ReactElement {
  let [ messages, setMessages ]           = useState<string[]>([])
  let [warningMessage, setWarningMessage] = useState('')
  let [activeTab, setActiveTab]           = useState('console')
  
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
        <div className="title-container">
          <h1>frost2x</h1>
        </div>
        <p>frost signer extension</p>
        <a 
          href="https://frostr.org" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          https://frostr.org
        </a>
        <div className="alpha-pill alpha-pill-standalone">alpha edition</div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <div className="tabs-nav-wrapper">
          <div className="tabs-navigation">
            <button 
              className={`tab-button ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => setActiveTab('console')}
            >
              <Icons.ConsoleIcon />
              <span>Console</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'node' ? 'active' : ''}`}
              onClick={() => setActiveTab('node')}
            >
              <Icons.NodeIcon />
              <span>Node</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`}
              onClick={() => setActiveTab('permissions')}
            >
              <Icons.PermissionsIcon />
              <span>Permissions</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Icons.SettingsIcon />
              <span>Settings</span>
            </button>
            <button 
              className={`tab-button ${activeTab === 'wallet' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallet')}
            >
              <Icons.WalletIcon />
              <span>Wallet</span>
            </button>
          </div>
        </div>

        <div className="tab-content">
          {/* Console Tab */}
          {activeTab === 'console' && (
            <div className="tab-panel">
              <Console />
            </div>
          )}

          {/* Node Tab */}
          {activeTab === 'node' && (
            <div className="tab-panel">
              <Node showMessage={showMessage}/>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="tab-panel">
              <Permissions showMessage={showMessage} />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-panel">
              <Settings showMessage={showMessage} />
            </div>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <div className="tab-panel">
              <Wallet showMessage={showMessage} />
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
  root.render(
    <StoreProvider>
      <Options />
    </StoreProvider>
  )
}
