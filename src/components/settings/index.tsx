import { useEffect, useState } from 'react'
import { useExtensionStore }   from '../../stores/extension.js'

import ExplorerSettings    from './explorer.js'
import GeneralSettings     from './general.js'
import TransactionSettings from './transaction.js'
import LinkSettings        from './links.js'

import type { SettingStore } from '../../types/index.js'

export default function Settings(
  { showMessage }: { showMessage: (msg: string) => void }
) {
  // State management
  const { store, reset, update } = useExtensionStore()

  const [ settings, setSettings ] = useState<SettingStore>(store.settings)

  useEffect(() => {
    setSettings(store.settings)
  }, [ store.settings ])

  const update_settings = (settings: Partial<SettingStore>) => {
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
    <>
      <div className="container settings-form">
        <GeneralSettings settings={settings} update={update_settings} />
        <ExplorerSettings settings={settings} update={update_settings} />
        <TransactionSettings settings={settings} update={update_settings} />
        {/* <LinkSettings settings={settings} update={update_settings} /> */}

        <button
          className="button button-primary save-button"
          onClick={save_settings}
        >
          Save
        </button>
      </div>
      
      <div className="container">
        <h2 className="section-header">Danger Zone</h2>
        <p className="description">For development and testing. Use at your own risk!</p>
        <button 
          onClick={() => reset()} 
          className="reset-button"
        >
          reset store
        </button>
      </div>
    </>
  )
}
