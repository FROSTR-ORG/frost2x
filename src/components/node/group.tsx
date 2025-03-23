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

  /**
   * Handle the update of the store.
   */
  const update = () => {
    // If an error exists, do not update the group.
    if (error !== null) return
    // If the input is empty,
    if (input === '') {
      // Set the group to null.
      NodeStore.update({ group : null })
    } else {
      // Parse the input into a group package.
      const group = get_group_pkg(input)
      // If the group package is invalid, return.
      if (group === null) return
      // Update the group in the store.
      NodeStore.update({ group })
    }
    // Set the saved state, and reset it after a short delay.
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  /**
   * Handle the validation of the input when it changes.
   */
  useEffect(() => {
    // If the input is empty, clear the error.
    if (input === '') {
      setError(null)
    } else if (!input.startsWith('bfgroup')) {
      // If the input does not start with "bfgroup", set an error.
      setError('input must start with "bfgroup1"')
    } else if (!is_group_string(input)) {
      // If the input contains invalid characters, set an error.
      setError('input contains invalid characters')
    } else {
      // Parse the input into a group package.
      const pkg = get_group_pkg(input)
      // If the group package is valid, clear the error.
      if (pkg !== null) {
        setError(null)
      } else {
        // If the group package is invalid, set an error.
        setError('failed to decode package data')
      }
    }
  }, [ input ])

  /**
   * Handle the update of the input when the store changes.
   */
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

/**
 * Check if the input is a valid group string.
 */
function is_group_string(input : string) {
  return /^bfgroup1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(input)
}

/**
 * Check if the input has changed and is valid.
 */
function is_group_changed (
  input : string,
  group : GroupPackage | null
) {
  // Encode the existing group package to a string.
  const group_str = get_group_str(group)
  // Determine if the group input has changed and is valid.
  return input !== group_str
}

/**
 * Get the group string from the group package.
 */
function get_group_str (group : GroupPackage | null) {
  try {
    return (group !== null) ? encode_group_pkg(group) : ''
  } catch {
    return ''
  }
}

/**
 * Get the group package from the input.
 */
function get_group_pkg (input : string) {
  try {
    return (input !== '') ? decode_group_pkg(input) : null
  } catch {
    return null
  }
}

/**
 * Get the group package from the input.
 */
function get_group_json(input : string) {
  try {
    const group = get_group_pkg(input)
    if (group === null) return null
    return JSON.stringify(group, null, 2)
  } catch (err) {
    return null
  }
}
