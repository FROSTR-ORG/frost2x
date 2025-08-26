import { useState, useEffect } from 'react'

import type { ChainNetwork, SettingStore } from '@/types/index.js'

type Props = {
  settings: SettingStore;
  saveSettings: (settings: Partial<SettingStore>) => boolean;
}

export default function ExplorerSettings({ settings, saveSettings }: Props) {
  // Local state for this section
  const [localSettings, setLocalSettings] = useState({
    network: settings.explorer.network,
    api_url: settings.explorer.api_url,
    link_url: settings.explorer.link_url,
    rate_limit: settings.explorer.rate_limit
  })
  
  // Update local state when main settings change
  useEffect(() => {
    setLocalSettings({
      network: settings.explorer.network,
      api_url: settings.explorer.api_url,
      link_url: settings.explorer.link_url,
      rate_limit: settings.explorer.rate_limit
    })
  }, [settings])
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      localSettings.network !== settings.explorer.network ||
      localSettings.api_url !== settings.explorer.api_url ||
      localSettings.link_url !== settings.explorer.link_url ||
      localSettings.rate_limit !== settings.explorer.rate_limit
    )
  }
  
  // Save changes to extension store
  const handleSave = () => {
    saveSettings({ explorer: localSettings })
  }
  
  // Revert unsaved changes
  const handleCancel = () => {
    setLocalSettings({
      network: settings.explorer.network,
      api_url: settings.explorer.api_url,
      link_url: settings.explorer.link_url,
      rate_limit: settings.explorer.rate_limit
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
            value={localSettings.network}
            onChange={e => updateField('network', e.target.value as ChainNetwork)}
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
            value={localSettings.api_url}
            onChange={e => updateField('api_url', e.target.value)}
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
            value={localSettings.link_url}
            onChange={e => updateField('link_url', e.target.value)}
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
            min={0}
            step={100}
            inputMode="numeric"
            value={Number.isFinite(localSettings.rate_limit) ? localSettings.rate_limit : 0}
            onChange={e => {
              const n = Number(e.target.value)
              updateField('rate_limit', Number.isFinite(n) && n >= 0 ? n : 0)
            }}
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
