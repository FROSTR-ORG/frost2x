import { useState, useEffect } from 'react'
import type { SettingStore, TxPriority } from '../../types/index.js'

type Props = {
  settings: SettingStore;
  saveSettings: (settings: Partial<SettingStore>) => boolean;
}

export default function TransactionSettings({ settings, saveSettings }: Props) {
  // Local state for this section
  const [localSettings, setLocalSettings] = useState({
    'tx/default_priority': settings['tx/default_priority'],
    'tx/max_fee_rate': settings['tx/max_fee_rate'],
    'tx/max_spend_amount': settings['tx/max_spend_amount']
  })
  
  // Update local state when main settings change
  useEffect(() => {
    setLocalSettings({
      'tx/default_priority': settings['tx/default_priority'],
      'tx/max_fee_rate': settings['tx/max_fee_rate'],
      'tx/max_spend_amount': settings['tx/max_spend_amount']
    })
  }, [settings])
  
  // Check if there are unsaved changes
  const hasChanges = () => {
    return (
      localSettings['tx/default_priority'] !== settings['tx/default_priority'] ||
      localSettings['tx/max_fee_rate'] !== settings['tx/max_fee_rate'] ||
      localSettings['tx/max_spend_amount'] !== settings['tx/max_spend_amount']
    )
  }
  
  // Save changes to extension store
  const handleSave = () => {
    saveSettings(localSettings)
  }
  
  // Revert unsaved changes
  const handleCancel = () => {
    setLocalSettings({
      'tx/default_priority': settings['tx/default_priority'],
      'tx/max_fee_rate': settings['tx/max_fee_rate'],
      'tx/max_spend_amount': settings['tx/max_spend_amount']
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
      <h2>Transaction Settings</h2>
      
      <div className="form-row">
        <label className="form-label">Default Priority</label>
        <div>
          <select 
            className="form-select"
            value={localSettings['tx/default_priority']}
            onChange={e => updateField('tx/default_priority', e.target.value as TxPriority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <p className="field-description">
            Select the default priority to use when estimating transaction fees.
          </p>
        </div>
      </div>
      
      <div className="form-row">
        <label className="form-label">Maximum Fee Rate</label>
        <div>
          <input 
            type="number"
            className="form-input"
            value={localSettings['tx/max_fee_rate']}
            onChange={e => updateField('tx/max_fee_rate', parseFloat(e.target.value))}
            placeholder="0.0001"
          />
          <p className="field-description">
            Enter the maximum fee rate (in sats/vbyte) the wallet will accept for a PSBT.
          </p>
        </div>
      </div>
      
      <div className="form-row">
        <label className="form-label">Maximum Spend Amount</label>
        <div>
          <input 
            type="number"
            className="form-input"
            value={localSettings['tx/max_spend_amount']}
            onChange={e => updateField('tx/max_spend_amount', parseInt(e.target.value))}
            placeholder="10000"
          />
          <p className="field-description">
            Enter the maximum amount (in sats) the wallet will spend on PSBT inputs.
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
