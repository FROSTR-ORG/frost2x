import { useEffect, useState } from 'react'
import { decode_group_pkg, encode_group_pkg }    from '@frostr/bifrost/lib'
import { useExtensionStore }   from '../../stores/extension.js'

import type { NodeStore }      from '../../types/index.js'

export default function ({ update } : { update: (data: Partial<NodeStore>) => void }) {
  const { store }                       = useExtensionStore()
  const [ input, setInput ]             = useState<string>('')
  const [ error, setError ]             = useState<string | null>(null)
  const [ show, setShow ]               = useState<boolean>(false)
  const [ isValid, setIsValid ]         = useState<boolean>(false)
  const [ decodedData, setDecodedData ] = useState<any>(null)

  const group_str = (store.node.group !== null)
    ? encode_group_pkg(store.node.group)
    : ''

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
        update({ group : decodedData })
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
    if (store.node.group !== null) {
      setInput(encode_group_pkg(store.node.group))
      setDecodedData(store.node.group)
    }
  }, [ store.node.group ])

  // Determine if the save button should be active
  const isSaveActive = isValid && (input !== group_str);

  return (
    <div className="container">
      <h2 className="section-header">Group Package</h2>
      <p className="description">Paste your encoded group package (starts with bfgroup). It contains information about the members of your signing group.</p>
      <div className="content-container">
        <div className="input-with-button">
          <input
            type={show ? "text" : "password"}
            value={input}
            onChange={e => setInput(e.target.value.trim())}
            placeholder="bfgroup1..."
          />
          <div className="input-actions">
            <button 
              className="button"
              onClick={() => setShow(!show)}
            >
              show
            </button>
            <button 
              className="button save-button" 
              onClick={() => isSaveActive && updateStore()}
              disabled={!isSaveActive}
            >
              save
            </button>
          </div>
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