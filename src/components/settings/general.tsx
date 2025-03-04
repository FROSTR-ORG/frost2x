import type { ExtensionSettingsProps } from '../../types.js'

import browser from 'webextension-polyfill'

export default function GeneralSettings ({ settings, update }: ExtensionSettingsProps) {

  const toggleNotifications = async () => {
    const newValue = !settings['general/show_notifications']

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

    update({ 'general/show_notifications': newValue })
  }

  return (
    <div className="settings-group">
      <div className="setting-item">
        <input
          type="checkbox"
          id="show-notifications"
          className="checkbox"
          checked={settings['general/show_notifications']}
          onChange={toggleNotifications}
        />
        <label htmlFor="show-notifications">
          Show notifications when the extension uses browser permissions
        </label>
      </div>
    </div>
  )
}
