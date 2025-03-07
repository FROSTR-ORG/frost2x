import type { ChainNetwork, SettingStore } from '../../types/index.js'

type Props = {
  settings: SettingStore;
  update: (s: Partial<SettingStore>) => void;
}

export default function ExplorerSettings({ settings, update }: Props) {
  return (
    <section className="settings-section">
      <h2>Explorer Settings</h2>
      
      <div className="form-row">
        <label className="form-label">Network</label>
        <div>
          <select 
            className="form-select"
            value={settings['explorer/network']}
            onChange={e => update({ 'explorer/network': e.target.value as ChainNetwork })}
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
            value={settings['explorer/api_url']}
            onChange={e => update({ 'explorer/api_url': e.target.value })}
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
            value={settings['explorer/link_url']}
            onChange={e => update({ 'explorer/link_url': e.target.value })}
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
            value={settings['explorer/rate_limit']}
            onChange={e => update({ 'explorer/rate_limit': parseInt(e.target.value) })}
            placeholder="1000"
          />
          <p className="field-description">
            Enter the rate limit (in milliseconds) for querying the explorer API.
          </p>
        </div>
      </div>
    </section>
  )
}
