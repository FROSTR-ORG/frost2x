import { useState } from 'react'

import type { ExtensionSettingsProps } from '../../types/index.js'

export default function LinkSettings ({ settings, update }: ExtensionSettingsProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  return (
    <div className="settings-group">
      <h2 className="section-header">Link Settings</h2>
      
      <div className="setting-item">
        <input
          type="checkbox"
          id="links-active"
          className="checkbox"
          checked={settings['links/is_active']}
          onChange={() => update({ 'links/is_active': !settings['links/is_active'] })}
        />
        <label htmlFor="links-active">
          Detect and highlight <code>nostr:</code> links in your browser.
        </label>
      </div>
      
      <div className="input-group-vertical">
        <p className="field-description">
          Enter the URL that should be used to open nostr links when clicked.
        </p>
        
        <input
          id="resolver-url"
          type="text"
          className="text-input"
          value={settings['links/resolver_url'] || ''}
          onChange={(e) => update({ 'links/resolver_url': e.target.value })}
          placeholder="https://example.com/{raw}"
        />
        
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