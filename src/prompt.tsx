import browser from 'webextension-polyfill'
import { createRoot } from 'react-dom/client'
import React from 'react'

import * as CONST from './const.js'

function Prompt() {
  let qs = new URLSearchParams(location.search)
  let id = qs.get('id')
  let host = qs.get('host')
  let type = qs.get('type')
  let params: any = null
  let event: any = null
  try {
    const paramString = qs.get('params')
    if (paramString) {
      params = JSON.parse(paramString)
      if (Object.keys(params).length === 0) params = null
      else if (params.event) event = params.event
    }
  } catch (err) {
    params = null
  }

  return (
    <>
      <div>
        <b style={{display: 'block', textAlign: 'center', fontSize: '200%'}}>
          {host}
        </b>{' '}
        <p>
          is requesting your permission to <b>{type && CONST.PERMISSION_LABELS[type]}:</b>
        </p>
      </div>
      {params && (
        <>
          <p>now acting on</p>
          <pre style={{overflow: 'auto', maxHeight: '120px'}}>
            <code>{JSON.stringify(event || params, null, 2)}</code>
          </pre>
        </>
      )}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-around'
        }}
      >
        <button
          style={{marginTop: '5px'}}
          onClick={authorizeHandler(
            true,
            {} // store this and answer true forever
          )}
        >
          authorize forever
        </button>
        {event?.kind !== undefined && (
          <button
            style={{marginTop: '5px'}}
            onClick={authorizeHandler(
              true,
              {kinds: {[event.kind]: true}} // store and always answer true for all events that match this condition
            )}
          >
            authorize kind {event.kind} forever
          </button>
        )}
        <button style={{marginTop: '5px'}} onClick={authorizeHandler(true, undefined)}>
          authorize just this
        </button>
        {event?.kind !== undefined ? (
          <button
            style={{marginTop: '5px'}}
            onClick={authorizeHandler(
              false,
              {kinds: {[event.kind]: true}} // idem
            )}
          >
            reject kind {event.kind} forever
          </button>
        ) : (
          <button
            style={{marginTop: '5px'}}
            onClick={authorizeHandler(
              false,
              {} // idem
            )}
          >
            reject forever
          </button>
        )}
        <button style={{marginTop: '5px'}} onClick={authorizeHandler(false, undefined)}>
          reject
        </button>
      </div>
    </>
  )

  function authorizeHandler(accept: boolean, conditions?: Record<string, any>) {
    return function (ev: React.MouseEvent<HTMLButtonElement>) {
      ev.preventDefault()
      browser.runtime.sendMessage({
        prompt: true,
        id,
        host,
        type,
        accept,
        conditions
      })
    }
  }
}

const container = document.getElementById('main')
if (container) {
  const root = createRoot(container)
  root.render(<Prompt />)
}
