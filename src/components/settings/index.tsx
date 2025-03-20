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

  // Function to save all settings - will be passed to individual components
  const saveSettings = (sectionSettings: Partial<SettingStore>) => {
    try {
      update({
        settings: {
          ...store.settings,
          ...sectionSettings
        }
      })
      showMessage('settings saved')
      return true
    } catch (error) {
      console.error('error saving settings:', error)
      showMessage('settings error')
      return false
    }
  }
  
  return (
    <>
      <div className="container settings-form">
        <GeneralSettings settings={store.settings} saveSettings={saveSettings} />
        <ExplorerSettings settings={store.settings} saveSettings={saveSettings} />
        <TransactionSettings settings={store.settings} saveSettings={saveSettings} />
        {/* <LinkSettings settings={store.settings} saveSettings={saveSettings} /> */}
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
