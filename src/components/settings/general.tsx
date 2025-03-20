import { useState, useEffect } from 'react'
import type { SettingStore } from '../../types/index.js'
import browser from 'webextension-polyfill'

type Props = {
  settings: SettingStore;
  saveSettings: (settings: Partial<SettingStore>) => boolean;
}

export default function GeneralSettings({ settings, saveSettings }: Props) {
  // Local state for this section
  const [localSettings, setLocalSettings] = useState({
    'general/notifications': settings['general/notifications']
  })
  
  // Update local state when main settings change
  useEffect(() => {
    setLocalSettings({
      'general/notifications': settings['general/notifications']
    })
  }, [settings])
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    return localSettings['general/notifications'] !== settings['general/notifications']
  }
  
  // Save changes to extension store
  const handleSave = () => {
    saveSettings(localSettings)
  }
  
  // Revert unsaved changes
  const handleCancel = () => {
    setLocalSettings({
      'general/notifications': settings['general/notifications']
    })
  }

  const toggleNotifications = async () => {
    const newValue = !localSettings['general/notifications']
    
    // Request permissions if turning on notifications
    if (newValue) {
      console.log('requesting permissions')
      const granted = await browser.permissions.request({
        permissions: ['notifications']
      })

      console.log('granted', granted)

      if (!granted) {
        // If permission denied, don't update state
        return
      }
    } else {
      console.log('revoking permissions')
      const removed = await browser.permissions.remove({
        permissions: ['notifications']
      })

      console.log('removed', removed)
    }

    setLocalSettings({
      ...localSettings,
      'general/notifications': newValue
    })
  }

  return (
    <section className="settings-section">
      <h2>General Settings</h2>
      
      <div className="form-row checkbox-container">
        <input 
          type="checkbox" 
          id="showNotifications" 
          checked={localSettings['general/notifications']}
          onChange={toggleNotifications}
        />
        <label htmlFor="showNotifications">
          Show notifications when the extension uses browser permissions.
        </label>
      </div>

      {/* Section action buttons */}
      <div className="settings-actions">
        <button 
          className="button button-secondary" 
          onClick={handleCancel}
          style={{ visibility: hasChanges() ? 'visible' : 'hidden' }}
        >
          Cancel
        </button>
        <button 
          className="button button-primary" 
          onClick={handleSave}
          disabled={!hasChanges()}
        >
          Save
        </button>
      </div>
    </section>
  )
}
