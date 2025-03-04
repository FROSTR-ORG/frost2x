import { useEffect, useState } from 'react'
import { decode_group_pkg }    from '@frostr/bifrost/lib'
import { useStore }            from './store.js'

export default function () {
  const { store, update }   = useStore()
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)
  const [ show, setShow ]   = useState<boolean>(false)
  const [ isValid, setIsValid ] = useState<boolean>(false)
  const [ decodedData, setDecodedData ] = useState<any>(null)

  const parseData = (pkg : string) => {
    try {
      const data = decode_group_pkg(pkg)
      setDecodedData(data)
      return data
    } catch (err) {
      setDecodedData(null)
      return null
    }
  }

  const updateStore = () => {
    try {
      if (input === '') {
        update({ group : null })
        setDecodedData(null)
      } else {
        parseData(input)
        update({ group : input })
        setError(null)
      }
      setError(null)
    } catch (err) {
      console.error(err)
      setError('failed to decode package data')
    }
  }

  // Check if input is valid whenever it changes
  useEffect(() => {
    if (input === '') {
      setIsValid(true) // Empty input is considered valid
      setDecodedData(null)
    } else {
      try {
        const data = decode_group_pkg(input)
        setDecodedData(data)
        setIsValid(true)
        setError(null)
      } catch (err) {
        setIsValid(false)
        setDecodedData(null)
        setError('failed to decode package data')
      }
    }
  }, [input])

  useEffect(() => {
    setInput(store.group ?? '')
    if (store.group) {
      try {
        parseData(store.group)
      } catch (err) {
        // Ignore errors when initializing
      }
    }
  }, [store.group])

  // Determine if the save button should be active
  const isSaveActive = isValid && (input !== store.group);

  return (
    <div className="container">
      <h2 className="section-header">Group Package</h2>
      <p className="description">Paste your encoded group package (starts with bfgroup). It contains information about the members of your signing group.</p>
      <div className="content-container">
        <div className="input-group">
          <input
            type={show ? "text" : "password"}
            value={input}
            placeholder='bfgroup1...'
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            className="button toggle-button" 
            onClick={() => setShow(!show)}
          >
            {show ? 'hide' : 'show'}
          </button>
          <button 
            onClick={() => isSaveActive && updateStore()} 
            className={`button save-button ${isSaveActive ? 'button-primary' : ''}`}
            disabled={!isSaveActive}
          >
            save
          </button>
        </div>
        
        {input !== '' && error === null && show && decodedData && (
          <pre className="code-display">
            {JSON.stringify(decodedData, null, 2)}
          </pre>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
} 