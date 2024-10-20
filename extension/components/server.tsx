import { useEffect, useState } from 'react'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState(store.sign_server_host)

  useEffect(() => {
    if (input !== store.sign_server_host) {
      setInput(store.sign_server_host)
    }
  }, [ store.sign_server_host ])

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
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          {
            input !== store.sign_server_host && (
              <button onClick={() => update({ sign_server_host : input })}>save</button>
            )
          }
        </div>
      </div>
    </div>
  )
}
