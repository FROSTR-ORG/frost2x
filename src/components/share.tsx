import { useEffect, useState } from 'react'
import { decode_share_pkg }    from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)

  const displayData = (pkg : string) => {
    const data = decode_share_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    if (input === '') {
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
    if (store.share !== null) {
      if (input === '') {
        setInput(store.share)
      }
    } else if (store.share === '') {
      update({ share : null })
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
            value={input}
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
