import { useEffect, useState, useRef } from 'react'

import browser from 'webextension-polyfill'

import type { LogEntry } from '../types/index.js'

export default function Console() {

  const [ logs, setLogs ]     = useState<LogEntry[]>([])
  const [ isInit, setIsInit ] = useState(false)
  
  // Create a ref for the console output element
  const consoleOutputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isInit) {
      browser.storage.sync.get(['logs']).then((result) => {
        setLogs(result.logs as LogEntry[] || [])
        setIsInit(true)
      })
    }
  }, [ isInit ])

  useEffect(() => {
    const listener = (changes: any) => {
      const new_logs = changes.logs?.newValue
      if (is_logs_changed(logs, new_logs)) {
        setLogs(new_logs as LogEntry[] || [])
      }
    }
    
    browser.storage.sync.onChanged.addListener(listener)
    return () => browser.storage.sync.onChanged.removeListener(listener)
  }, [ logs ])

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (consoleOutputRef.current) {
      const element = consoleOutputRef.current
      element.scrollTop = element.scrollHeight
    }
  }, [logs])

  const clear = () => {
    browser.storage.sync.set({ logs: [] })
  }

  // Add resetNode function
  const reset = () => {
    try {
      clear()
      browser.runtime.sendMessage({ type: 'node_reset' })
    } catch (error) {
      console.error('error resetting node:')
      console.error(error)
    }
  }

  return (
    <div className="container console-container">
      <h2 className="section-header">Event Console</h2>
      <p className="description">Monitor events from your bifrost node.</p>
      
      <div 
        className="console-output" 
        ref={consoleOutputRef}
      >
        {logs.length === 0 ? (
          <div className="console-empty">No events logged yet</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} className={`console-entry console-${log.type}`}>
              <span className="console-timestamp">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="console-message">{log.message}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="console-controls">
        <button className="button" onClick={clear}>Clear Console</button>
        <button className="button button-reset" onClick={reset}>Reset Node</button>
      </div>
    </div>
  );
}

function is_logs_changed (
  curr: LogEntry[],
  next: LogEntry[]
) {
  return JSON.stringify(curr) !== JSON.stringify(next)
}
