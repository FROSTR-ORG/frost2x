import { useEffect, useState } from 'react'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState(store.server_host)

  useEffect(() => {
    if (input !== store.server_host) {
      setInput(store.server_host)
    }
  }, [ store.server_host ])

  const updateInput = (value : string) => {
    setInput((value !== '') ? value : null)
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
            input !== store.server_host && (
              <button onClick={() => update({ server_host : input })}>save</button>
            )
          }
        </div>
      </div>
    </div>
  )
}
