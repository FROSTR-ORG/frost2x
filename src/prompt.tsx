import browser from 'webextension-polyfill'

import { createRoot } from 'react-dom/client'
import { parse_json } from '@/lib/utils.js'

import type { MouseEvent } from 'react'

import type {
  PromptMessage,
  SignedEvent
} from '@/types/index.js'

import * as CONST from '@/const.js'

import '@/styles/prompt.css'

function Prompt() {
  // Parse the query string from the window location url.
  const query_str = new URLSearchParams(location.search)

  console.log('query_str:', query_str)

  // Extract the id, host, and type from the query string.
  const msg = parse_message(query_str)

  if (msg === null) return <p>Invalid Prompt Message</p>

  const params = parse_params(query_str)
  const event  = (params?.event ?? null) as SignedEvent | null

  const formatJSON = (json: any): string => {
    return JSON.stringify(json, null, 2);
  }

  // Apply basic syntax highlighting for JSON
  const renderHighlightedJSON = (jsonString: string) => {
    return jsonString
      .replace(/"(\w+)":/g, '<span class="json-key">"$1":</span>')
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
  }

  const perm_type   = msg.type as keyof typeof CONST.PERMISSION_LABELS
  const perm_label  = CONST.PERMISSION_LABELS[perm_type]
  const perm_method = parse_method(perm_type)

  return (
    <div className="prompt-container">
      <div className="prompt-header">
        <div className="prompt-hostname">{msg.host}</div>
        <p>is requesting your permission to <b>{perm_label}:</b></p>
      </div>
      
      {params && (
        <div className="prompt-content">
          <div className="json-container">
            <pre className="json-content" 
                 dangerouslySetInnerHTML={{ 
                   __html: renderHighlightedJSON(formatJSON(event || params)) 
                 }}>
            </pre>
          </div>
        </div>
      )}
      
      <div className="buttons-container">

        {/* Single-use buttons row */}
        <div className="button-row">
          <button 
            className="prompt-button authorize-button button-half-width"
            onClick={send_response(msg, true, undefined)}>
            allow this request
          </button>
          <button 
            className="prompt-button reject-button button-half-width"
            onClick={send_response(msg, false, undefined)}>
            reject this request
          </button>
        </div>

        {/* Kind-specific buttons row */}
        {event?.kind !== undefined && (
          <div className="button-row">
            <button
              className="prompt-button authorize-button button-half-width"
              onClick={send_response(msg, true, {kinds: {[event.kind]: true}})}
            >
              allow kind {event.kind} events
            </button>
            <button
              className="prompt-button reject-button button-half-width"
              onClick={send_response(msg, false, {kinds: {[event.kind]: true}})}
            >
              reject kind {event.kind} events
            </button>
          </div>
        )}

        {/* Full-width authorize forever button */}
        <div className="button-row">
          <button
            className="prompt-button authorize-button button-full-width"
            onClick={send_response(msg, true, {})}
          >
            allow all {perm_method} requests
          </button>
        </div>
      </div>
    </div>
  )
}

function send_response (
  template    : Partial<PromptMessage>,
  accept      : boolean,
  conditions ?: Record<string, any>
) {
  return function (event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    const msg = { prompt: true, ...template, accept, conditions }
    console.log('send_response msg:', msg)
    browser.runtime.sendMessage(msg)
  }
}

function parse_message (
  url_params: URLSearchParams
) : PromptMessage | null {
  const id     = url_params.get('id')
  const host   = url_params.get('host')
  const type   = url_params.get('type')
  if (id === null || host === null || type === null) return null
  return { id, host, type }
}

function parse_method (type: string) {
  return type.includes('.')
    ? type.split('.').slice(1).join('.')
    : type
}

function parse_params (url_params: URLSearchParams) {
  try {
    const params = url_params.get('params')
    if (params === null) return null
    const parsed = parse_json<Record<string, any>>(params)
    if (parsed === null) return null
    if (Object.keys(parsed).length === 0) return null
    return parsed
  } catch (err) {
    return null
  }
}

const container = document.getElementById('main')
if (container) {
  const root = createRoot(container)
  root.render(<Prompt />)
}
