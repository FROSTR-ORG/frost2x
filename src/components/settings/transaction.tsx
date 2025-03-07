import type { SettingStore, TxPriority } from '../../types/index.js'

type Props = {
  settings: SettingStore;
  update: (s: Partial<SettingStore>) => void;
}

export default function TransactionSettings({ settings, update }: Props) {
  return (
    <section className="settings-section">
      <h2>Transaction Settings</h2>
      
      <div className="form-row">
        <label className="form-label">Default Priority</label>
        <div>
          <select 
            className="form-select"
            value={settings['tx/default_priority']}
            onChange={e => update({ 'tx/default_priority': e.target.value as TxPriority })}
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
            value={settings['tx/max_fee_rate']}
            onChange={e => update({ 'tx/max_fee_rate': parseFloat(e.target.value) })}
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
            value={settings['tx/max_spend_amount']}
            onChange={e => update({ 'tx/max_spend_amount': parseInt(e.target.value) })}
            placeholder="10000"
          />
          <p className="field-description">
            Enter the maximum amount (in sats) the wallet will spend on PSBT inputs.
          </p>
        </div>
      </div>
    </section>
  )
}
