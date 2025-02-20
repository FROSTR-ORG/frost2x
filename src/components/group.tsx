import { useEffect, useState } from 'react'
import { decode_group_pkg }    from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)

  const displayData = (pkg : string) => {
    const data = decode_group_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    try {
      if (input === '') {
        update({ group : null })
      } else {
        decode_group_pkg(input)
        update({ group : input })
        setError(null)
      }
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    setInput(store.group ?? '')
  }, [ store.group ])

  return (
    <div>
      <div>group package:</div>
      <div
        style={{
          marginTop: '10px',
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
            placeholder='bfgroup1...'
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
