import { useEffect, useState } from 'react'
import { decode_share_pkg }    from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string | null>(null)
  const [ error, setError ] = useState<string | null>(null)

  const displayData = (pkg : string) => {
    const data = decode_share_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    if (input === null) {
      setError('no input')
      return
    }
    try {
      decode_share_pkg(input)
      update({ share : input })
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    if (store.share !== null && input === null) {
      setInput(store.share)
    }
  }, [ store.share ])

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
        { input !== null && error === null &&
          <pre>{displayData(input)}</pre> 
        }
        <p>{error}</p>
      </div>
    </div>
  )
}
