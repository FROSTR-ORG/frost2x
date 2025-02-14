import { useEffect, useState } from 'react'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState(store.server)

  useEffect(() => {
    if (input !== store.server) {
      setInput(store.server)
    }
  }, [ store.server ])

  const updateInput = (value : string) => {
    const input = (value !== '') ? value : null
    setInput(input)
  }

  return (
    <div>
      <div>signing server:&nbsp;</div>
      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            style={{ width: '600px' }}
            value={input ?? ''}
            onChange={(e) => updateInput(e.target.value)}
          />
          {
            input !== store.server && (
              <button onClick={() => update({ server : input })}>save</button>
            )
          }
        </div>
      </div>
    </div>
  )
}
