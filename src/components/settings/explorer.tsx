import { useState, useEffect } from 'react'
import type { ChainNetwork, SettingStore } from '../../types/index.js'

type Props = {
  settings: SettingStore;
  saveSettings: (settings: Partial<SettingStore>) => boolean;
}

export default function ExplorerSettings({ settings, saveSettings }: Props) {
  // Local state for this section
  const [localSettings, setLocalSettings] = useState({
    'explorer/network': settings['explorer/network'],
    'explorer/api_url': settings['explorer/api_url'],
    'explorer/link_url': settings['explorer/link_url'],
    'explorer/rate_limit': settings['explorer/rate_limit']
  })
  
  // Update local state when main settings change
  useEffect(() => {
    setLocalSettings({
      'explorer/network': settings['explorer/network'],
      'explorer/api_url': settings['explorer/api_url'],
      'explorer/link_url': settings['explorer/link_url'],
      'explorer/rate_limit': settings['explorer/rate_limit']
    })
  }, [settings])
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      localSettings['explorer/network'] !== settings['explorer/network'] ||
      localSettings['explorer/api_url'] !== settings['explorer/api_url'] ||
      localSettings['explorer/link_url'] !== settings['explorer/link_url'] ||
      localSettings['explorer/rate_limit'] !== settings['explorer/rate_limit']
    )
  }
  
  // Save changes to extension store
  const handleSave = () => {
    saveSettings(localSettings)
  }
  
  // Revert unsaved changes
  const handleCancel = () => {
    setLocalSettings({
      'explorer/network': settings['explorer/network'],
      'explorer/api_url': settings['explorer/api_url'],
      'explorer/link_url': settings['explorer/link_url'],
      'explorer/rate_limit': settings['explorer/rate_limit']
    })
  }

  // Update local state for a specific field
  const updateField = (field: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      [field]: value
    })
  }

  return (
    <section className="settings-section">
      <h2>Explorer Settings</h2>
      
      <div className="form-row">
        <label className="form-label">Network</label>
        <div>
          <select 
            className="form-select"
            value={localSettings['explorer/network']}
            onChange={e => updateField('explorer/network', e.target.value as ChainNetwork)}
          >
            <option value="mainnet">Mainnet</option>
            <option value="testnet">Testnet</option>
          </select>
          <p className="field-description">
            Select the chain network you want to use.
          </p>
        </div>
      </div>
      
      <div className="form-row">
        <label className="form-label">Explorer API URL</label>
        <div>
          <input 
            type="text"
            className="form-input"
            value={localSettings['explorer/api_url']}
            onChange={e => updateField('explorer/api_url', e.target.value)}
            placeholder="https://mempool.space/api"
          />
          <p className="field-description">
            Enter the URL of the explorer API endpoint you want to use for fetching data.
          </p>
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">Explorer Browser URL</label>
        <div>
          <input 
            type="text"
            className="form-input"
            value={localSettings['explorer/link_url']}
            onChange={e => updateField('explorer/link_url', e.target.value)}
            placeholder="https://mempool.space"
          />
          <p className="field-description">
            Enter the URL of the explorer browser you want to use for viewing transactions.
          </p>
        </div>
      </div>
      
      <div className="form-row">
        <label className="form-label">Rate Limit</label>
        <div>
          <input 
            type="number"
            className="form-input"
            value={localSettings['explorer/rate_limit']}
            onChange={e => updateField('explorer/rate_limit', parseInt(e.target.value))}
            placeholder="1000"
          />
          <p className="field-description">
            Enter the rate limit (in milliseconds) for querying the explorer API.
          </p>
        </div>
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
