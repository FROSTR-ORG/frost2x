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

    update({ 'general/notifications': newValue })
  }

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
