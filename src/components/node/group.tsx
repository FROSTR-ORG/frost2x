import { useEffect, useState } from 'react'
import { NodeStore }           from '@/stores/node.js'

import {
  decode_group_pkg,
  encode_group_pkg,
} from '@frostr/bifrost/lib'

import type { GroupPackage } from '@frostr/bifrost'


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
      NodeStore.update({ group : null })
    } else {
      // Parse the input and update the group.
      const group = get_group_pkg(input)
      if (group === null) return
      NodeStore.update({ group })
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  // Validate the group input when it changes.
  useEffect(() => {
    if (input === '') {
      setError(null)
    } else if (!input.startsWith('bfgroup')) {
      setError('input must start with "bfgroup1"')
    } else if (!is_group_string(input)) {
      setError('input contains invalid characters')
    } else {
      const pkg = get_group_pkg(input)
      if (pkg !== null) {
        setError(null)
      } else {
        setError('failed to decode package data')
      }
    }
  }, [ input ])

  useEffect(() => {
    try {
      if (store.group === null) {
        setInput('')
        setError(null)
      } else {
        const str = encode_group_pkg(store.group)
        setInput(str)
        setError(null)
      }
    } catch (err) {
      setError('failed to decode package data')
    }
  }, [ store.group ])

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
              {show ? 'hide' : 'show'}
            </button>
            <button
              className={`button action-button ${saved ? 'saved-button' : ''}`} 
              onClick={update}
              disabled={!is_group_changed(input, store.group) || error !== null}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
        
        {input !== '' && error === null && show && (
          <pre className="code-display">
            {get_group_json(input) ?? 'invalid group package'}
          </pre>
        )}
        <div className="notification-container">
          {error && <p className="error-text">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function is_group_string(input : string) {
  return /^bfgroup1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(input)
}

function is_group_changed (
  input : string,
  group : GroupPackage | null
) {
  // Encode the existing group package to a string.
  const group_str = get_group_str(group)
  // Determine if the group input has changed and is valid.
  return input !== group_str
}

function get_group_str (group : GroupPackage | null) {
  try {
    return (group !== null) ? encode_group_pkg(group) : ''
  } catch {
    return ''
  }
}

function get_group_pkg (input : string) {
  try {
    return (input !== '') ? decode_group_pkg(input) : null
  } catch {
    return null
  }
}

function get_group_json(input : string) {
  try {
    const group = get_group_pkg(input)
    if (group === null) return null
    return JSON.stringify(group, null, 2)
  } catch (err) {
    return null
  }
}
