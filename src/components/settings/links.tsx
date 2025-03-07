import { useState, useEffect } from 'react'

import type { ExtensionSettingsProps } from '../../types/index.js'

type Props = {
  settings: SettingStore;
  saveSettings: (settings: Partial<SettingStore>) => boolean;
}

export default function LinkSettings({ settings, saveSettings }: Props) {
  // Local state for this section
  const [localSettings, setLocalSettings] = useState({
    'links/is_active': settings['links/is_active'],
    'links/resolver_url': settings['links/resolver_url'] || ''
  })
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // Update local state when main settings change
  useEffect(() => {
    setLocalSettings({
      'links/is_active': settings['links/is_active'],
      'links/resolver_url': settings['links/resolver_url'] || ''
    })
  }, [settings])
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      localSettings['links/is_active'] !== settings['links/is_active'] ||
      localSettings['links/resolver_url'] !== (settings['links/resolver_url'] || '')
    )
  }
  
  // Save changes to extension store
  const handleSave = () => {
    saveSettings(localSettings)
  }
  
  // Revert unsaved changes
  const handleCancel = () => {
    setLocalSettings({
      'links/is_active': settings['links/is_active'],
      'links/resolver_url': settings['links/resolver_url'] || ''
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
    <div className="settings-group">
      <h2 className="section-header">Link Settings</h2>
      
      <div className="form-row checkbox-container">
        <input
          type="checkbox"
          id="links-active"
          checked={localSettings['links/is_active']}
          onChange={() => updateField('links/is_active', !localSettings['links/is_active'])}
        />
        <label htmlFor="links-active">
          Detect and highlight <code>nostr:</code> links in your browser.
        </label>
      </div>
      
      <div className="form-row">
        <label className="form-label">Resolver URL</label>
        <div>
          <input
            type="text"
            className="form-input"
            value={localSettings['links/resolver_url']}
            onChange={(e) => updateField('links/resolver_url', e.target.value)}
            placeholder="https://example.com/{raw}"
          />
          <p className="field-description">
            Enter the URL that should be used to open nostr links when clicked.
          </p>
          
          <button 
            className="info-button" 
            onClick={() => setShowInfoModal(!showInfoModal)}
          >
            {showInfoModal ? 'Hide Examples' : 'Show Examples'}
          </button>
          
          {showInfoModal && (
            <div className="info-modal">
              <div className="info-modal-content">
                <h4>Link Examples</h4>
                <pre className="code-display">{nostr_link_help_txt}</pre>
              </div>
            </div>
          )}
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

const nostr_link_help_txt = `
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
` 