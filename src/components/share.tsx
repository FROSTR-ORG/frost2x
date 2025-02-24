import { useEffect, useState } from 'react'
import { decode_share_pkg }    from '@frostr/bifrost/lib'

import useStore from './store.js'

export default function () {

  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)
  const [ show, setShow ]   = useState<boolean>(false)

  const displayData = (pkg : string) => {
    const data = decode_share_pkg(pkg)
    return JSON.stringify(data, null, 2)
  }

  const updateStore = () => {
    try {
      if (input === '') {
        update({ share : null })
      } else {
        decode_share_pkg(input)
        update({ share : input })
        setError(null)
      }
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  useEffect(() => {
    setInput(store.share ?? '')
  }, [ store.share ])

  return (
    <div>
      <div>share package:</div>
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
            type={show ? "text" : "password"}
            style={{ width: '600px' }}
            value={input}
            placeholder='bfshare1...'
            onChange={(e) => setInput(e.target.value)}
          />
          <button onClick={() => setShow(!show)}>
            {show ? 'hide' : 'show'}
          </button>
          <button onClick={() => updateStore()}>save</button>
        </div>
        { input !== '' && error === null && show &&
          <pre>{displayData(input)}</pre> 
        }
        <p>{error}</p>
      </div>
    </div>
  )
}