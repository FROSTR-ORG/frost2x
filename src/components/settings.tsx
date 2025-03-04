import { useEffect, useState } from 'react'

import GeneralSettings from './settings/general.js'
import LinkSettings    from './settings/links.js'

import useStore from './store.js'

import type { ExtensionSettings } from '../types.js'

export default function Settings({ showMessage }: { showMessage: (msg: string) => void }) {
  // State management
  const { store, update } = useStore()

  const [ settings, setSettings ] = useState<ExtensionSettings>(store.settings)

  useEffect(() => {
    setSettings(store.settings)
  }, [ store.settings ])

  const update_settings = (settings: Partial<ExtensionSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...settings
    }))
  }

  // Event handlers for main settings
  const save_settings = () => {
    try {
      update ({
        settings : {
          ...store.settings,
          ...settings
        }
      })
      showMessage('settings saved')
    } catch (error) {
      console.error('error saving settings:', error)
      showMessage('settings error')
    }
  }
  
  return (
    <div className="container">
      <h2 className="section-header">Extension Settings</h2>
      <p className="description">Configure various settings for the signing extension.</p>

      <GeneralSettings settings={settings} update={update_settings} />
      {/* <LinkSettings settings={settings} update={update_settings} /> */}

      <button
        className="button button-primary save-button"
        onClick={save_settings}
      >
        Save
      </button>
    </div>  
  )
}
