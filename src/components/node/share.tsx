import { useEffect, useState } from 'react'
import { decode_share_pkg }    from '@frostr/bifrost/lib'
import { useStore }            from '../store.js'

import type { NodeStore } from '../../types/index.js'

export default function ({ update } : { update: (data: Partial<NodeStore>) => void }) {
  const { store } = useStore()
  const { node  } = store
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)
  const [ show, setShow ]   = useState<boolean>(false)
  const [ isValid, setIsValid ] = useState<boolean>(false)
  const [ decodedData, setDecodedData ] = useState<any>(null)

  const parseData = (pkg: string) => {
    try {
      const data = decode_share_pkg(pkg)
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
        update({ share: null })
        setDecodedData(null)
      } else {
        parseData(input)
        update({ share: input })
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
        const data = decode_share_pkg(input)
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
    setInput(node.share ?? '')
    if (node.share) {
      try {
        parseData(node.share)
      } catch (err) {
        // Ignore errors when initializing
      }
    }
  }, [node.share])

  // Determine if the save button should be active
  const isSaveActive = isValid && (input !== node.share);

  const toggleShow = () => {
    setShow(!show)
  }

  const saveData = () => {
    if (isSaveActive) {
      updateStore()
    }
  }

  return (
    <div className="container">
      <h2 className="section-header">Share Package</h2>
      <p className="description">Paste your encoded share package (starts with bfshare). It contains secret information required for signing. Do not share it with anyone.</p>
      <div className="content-container">
        <div className="input-with-button">
          <input
            type={show ? "text" : "password"}
            value={input}
            placeholder='bfshare1...'
            onChange={(e) => setInput(e.target.value.trim())}
          />
          <div className="input-actions">
            <button 
              className="button"
              onClick={toggleShow}
            >
              show
            </button>
            <button 
              className="button save-button" 
              onClick={saveData}
              disabled={!isSaveActive}
            >
              save
            </button>
          </div>
        </div>
        
        { input !== '' && error === null && show && decodedData && (
          <pre className="code-display">
            {JSON.stringify(decodedData, null, 2)}
          </pre>
        )}
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  )
}
