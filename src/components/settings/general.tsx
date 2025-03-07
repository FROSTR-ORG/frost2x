import type { SettingStore } from '../../types/index.js'

import browser from 'webextension-polyfill'

type Props = {
  settings: SettingStore;
  update: (s: Partial<SettingStore>) => void;
}

export default function GeneralSettings({ settings, update }: Props) {

  const toggleNotifications = async () => {
    const newValue = !settings['general/notifications']

    console.log('toggleNotifications', newValue)
      
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

    update({ 'general/notifications': newValue })
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
          checked={settings['general/notifications']}
          onChange={toggleNotifications}
        />
        <label htmlFor="showNotifications">
          Show notifications when the extension uses browser permissions.
        </label>
      </div>
    </section>
  )
}
