import { useState, useEffect } from 'react'

import { SettingStore } from '@/stores/settings.js'

import browser from 'webextension-polyfill'

type Props = {
  store: SettingStore.Type
}

export default function GeneralSettings({ store } : Props) {
  const [ settings, setSettings ] = useState<SettingStore.Type['general']>(store.general)
  const [ changes, setChanges ]   = useState<boolean>(false)
  const [ error, setError ]       = useState<string | null>(null)
  const [ saved, setSaved ]       = useState<boolean>(false)

  // Discard changes by resetting local state from store
  const cancel = () => {
    setSettings(store.general)
    setChanges(false)
  }

  // Update the peer policies in the store.
  const save = () => {
    SettingStore.update({ general: settings })
    setChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const toggleNotifications = async () => {
    const newValue = !settings.notifications
    
    // Request permissions if turning on notifications
    if (newValue) {
      const granted = await browser.permissions.request({ permissions: ['notifications'] })
      if (!granted) {
        setError('Failed to request notifications permission')
        return
      }
    } else {
      const removed = await browser.permissions.remove({ permissions: ['notifications'] })  
      if (!removed) {
        setError('Failed to remove notifications permission')
        return
      }
    }
    
    setSettings({...settings, notifications: newValue })
    setError(null)
    setChanges(true)
  }

  useEffect(() => {
    setSettings(store.general)
    setChanges(false)
  }, [ store.general ])

  useEffect(() => {
    if (error !== null) setTimeout(() => setError(null), 1500)
  }, [ error ])

  return (
    <section className="settings-section">
      <h2>General Settings</h2>
      
      <div className="form-row checkbox-container">
        <input 
          type="checkbox" 
          id="showNotifications" 
          checked={settings.notifications}
          onChange={toggleNotifications}
        />
        <label htmlFor="showNotifications">
          Show notifications when the extension uses browser permissions.
        </label>
      </div>

      {/* Section action buttons */}
      <div className="settings-actions">
        <button
          className={`button button-primary action-button ${saved ? 'saved-button' : ''}`} 
          onClick={save}
          disabled={!changes}
        >
          {saved ? 'Saved' : 'Save'}
        </button>
        <button
          className="button button-secondary" 
          onClick={cancel}
          style={{ visibility: changes ? 'visible' : 'hidden' }}
        >
          Cancel
        </button>
        <div className="notification-container">
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </section>
  )
}
