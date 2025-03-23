import { NodeStore }    from '@/stores/node.js'
import { SettingStore } from '@/stores/settings.js'

export default function DevSettings() {

  const reset = () => {
    NodeStore.reset()
    SettingStore.reset()
  }

  return (
    <section className="settings-section">
      <h2>Danger Zone</h2>
      <p className="description">For development and testing. Use at your own risk!</p>
      <button
        onClick={() => reset()} 
        className="button button-remove"
      >
        Reset Store
      </button>
    </section>
  )
}
