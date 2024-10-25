import { useEffect, useState } from 'react'
import { decode_group_pkg }    from '@cmdcode/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState('')
  const [ error, setError ] = useState<string | null>(null)

  const displayData = (pkg : string) => {
    const data = decode_group_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    try {
      decode_group_pkg(input)
      update({ group_pkg : input })
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    if (store.group_pkg !== null) {
      if (typeof store.group_pkg === 'string') {
        setInput(store.group_pkg)
      } else {
        update({ group_pkg : null })
      }
    }
    if (typeof store.group_pkg !== 'string') {

    }
  }, [ store.group_pkg ])

  return (
    <div>
      <div>group data:&nbsp;</div>
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
