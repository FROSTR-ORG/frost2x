import { useEffect, useState } from 'react'
import { decode_secret_pkg }   from '@cmdcode/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState('')
  const [ error, setError ] = useState<string | null>(null)

  const displayData = (pkg : string) => {
    const data = decode_secret_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    try {
      decode_secret_pkg(input)
      update({ secret_pkg : input })
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    if (store.secret_pkg !== null) {
      if (typeof store.secret_pkg === 'string') {
        setInput(store.secret_pkg)
      } else {
        update({ secret_pkg : null })
      }
    }
    if (typeof store.secret_pkg !== 'string') {

    }
  }, [ store.secret_pkg ])

  return (
    <div>
      <div>secret data:&nbsp;</div>
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
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={() => updateStore()}>save</button>
        </div>
        { input !== '' && error === null &&
          <pre>{displayData(input)}</pre> 
        }
        <p>{error}</p>
      </div>
    </div>
  )
}
