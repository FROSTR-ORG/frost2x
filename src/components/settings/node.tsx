import { useState, useEffect } from 'react'
import { SettingStore }        from '@/stores/settings.js'

type Props = {
  store: SettingStore.Type
}

export default function NodeSettings({ store } : Props) {
  const [ settings, setSettings ] = useState<SettingStore.Type['node']>(store.node)
  const [ changes, setChanges ]   = useState<boolean>(false)
  const [ error, setError ]       = useState<string | null>(null)
  const [ saved, setSaved ]       = useState<boolean>(false)

  // Discard changes by resetting local state from store
  const cancel = () => {
    setSettings(store.node)
    setChanges(false)
  }

  // Update the peer policies in the store.
  const save = () => {
    SettingStore.update({ node: settings })
    setChanges(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const update_rate_limit = async (rate_limit : number) => {
    // Ensure rate_limit is finite and non-negative, default to 0
    const safeRateLimit = Number.isFinite(rate_limit) && rate_limit >= 0 ? rate_limit : 0
    setSettings({...settings, rate_limit: safeRateLimit })
    setError(null)
    setChanges(true)
  }

  useEffect(() => {
    setSettings(store.node)
    setChanges(false)
  }, [ store.node ])

  useEffect(() => {
    if (error !== null) setTimeout(() => setError(null), 1500)
  }, [ error ])

  return (
    <section className="settings-section">
      <h2>Node Settings</h2>
      <div className="form-row number-container">
        <label className="form-label" htmlFor="signature-request-rate-limit">
          Signature Request Rate Limit
        </label>
        <input
          type="number" 
          id="signature-request-rate-limit"
          min={0}
          step={100}
          inputMode="numeric"
          value={Number.isFinite(settings.rate_limit) ? settings.rate_limit : 0}
          onChange={(e) => {
            const n = Number(e.target.value)
            update_rate_limit(n)
          }}
        />
        <p className="field-description">
          Limits the rate of signature requests sent by your node. Any requests above this limit will be batched together. Useful for relays that have a rate limit.
        </p>
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
