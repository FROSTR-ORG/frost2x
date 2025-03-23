import { useEffect, useState } from 'react'
import { NodeStore }           from '@/stores/node.js'

import {
  decode_share_pkg,
  encode_share_pkg
} from '@frostr/bifrost/lib'

import type { SharePackage } from '@frostr/bifrost'

export default function ({ store } : { store : NodeStore.Type }) {
  const [ input, setInput ] = useState<string>('')
  const [ error, setError ] = useState<string | null>(null)
  const [ show, setShow   ] = useState<boolean>(false)
  const [ saved, setSaved ] = useState<boolean>(false)

  // Update the group in the store.
  const update = () => {
    // If there is an error, do not update the group.
    if (error !== null) return
    // If the input is empty,
    if (input === '') {
      // Set the group to null.
      NodeStore.update({ share : null })
    } else {
      // Parse the input and update the group.
      const share = get_share_pkg(input)
      if (share === null) return
      NodeStore.update({ share })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Validate the share input when it changes.
  useEffect(() => {
    if (input === '') {
      setError(null)
    } else if (!input.startsWith('bfshare')) {
      setError('input must start with "bfshare1"')
    } else if (!is_share_string(input)) {
      setError('input contains invalid characters')
    } else {
      const share = get_share_pkg(input)
      if (share !== null) {
        setError(null)
      } else {
        setError('failed to decode package data')
      }
    }
  }, [ input ])

  useEffect(() => {
    try {
      if (store.share === null) {
        setInput('')
        setError(null)
      } else {
        const str = encode_share_pkg(store.share)
        setInput(str)
        setError(null)
      }
    } catch (err) {
      setError('failed to decode package data')
    }
  }, [ store.share ])

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
              onClick={() => setShow(!show)}
            >
              {show ? 'hide' : 'show'}
            </button>
            <button
              className={`button action-button ${saved ? 'saved-button' : ''}`}
              onClick={update}
              disabled={!is_share_changed(input, store.share) || error !== null}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        
        { input !== '' && error === null && show && (
          <pre className="code-display">
            {get_share_json(input) ?? 'invalid share package'}
          </pre>
        )}
        <div className="notification-container">
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function is_share_string(input : string) {
  return /^bfshare1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(input)
}

function is_share_changed (
  input : string,
  share : SharePackage | null
) {
  // Encode the existing share package to a string.
  const share_str = get_share_str(share)
  // Determine if the share input has changed and is valid.
  return input !== share_str
}

function get_share_str (share : SharePackage | null) {
  try {
    return (share !== null) ? encode_share_pkg(share) : ''
  } catch {
    return ''
  }
}

function get_share_pkg (input : string) {
  try {
    return (input !== '') ? decode_share_pkg(input) : null
  } catch {
    return null
  }
}

function get_share_json(input : string) {
  try {
    const share = get_share_pkg(input)
    if (share === null) return null
    return JSON.stringify(share, null, 2)
  } catch (err) {
    return null
  }
}