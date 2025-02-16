import { useEffect, useState } from 'react'
import { decode_group_pkg }    from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {
  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)
  const [ decoded, setDecoded ] = useState<string | null>(null)

  const tryDecodeData = (pkg: string) => {
    if (pkg === '') return null
    try {
      const data = decode_group_pkg(pkg)
      setError(null)
      return JSON.stringify(data, null, 2)
    } catch (err) {
      return null
    }
  }

  const updateStore = () => {
    if (input === '') {
      setError('no input')
      return
    }
    try {
      decode_group_pkg(input)
      update({ group: input })
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    if (store.group !== null) {
      if (input === '') {
        setInput(store.group)
      }
    } else if (store.group === '') {
      update({ group: null })
    }
  }, [store.group])

  useEffect(() => {
    setDecoded(tryDecodeData(input))
  }, [input])

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
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={() => updateStore()}>save</button>
        </div>
        {decoded && <pre>{decoded}</pre>}
        <p>{error}</p>
      </div>
    </div>
  )
}
