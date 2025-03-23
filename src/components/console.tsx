import browser          from 'webextension-polyfill'
import { LogStore }     from '../stores/logs.js'
import { MESSAGE_TYPE } from '../const.js'

import {
  useEffect,
  useState,
  useRef
} from 'react'

import type { LogEntry } from '../types/index.js'

export default function Console() {
  // State for logs
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  // Create a ref for the console output element
  const consoleOutputRef = useRef<HTMLDivElement>(null)

  // Load logs on mount and set up subscription.
  useEffect(() => {
    LogStore.fetch().then(logs => setLogs(logs))
    const unsub = LogStore.subscribe(logs => setLogs(logs))
    return () => unsub()
  }, [])

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (consoleOutputRef.current) {
      const element     = consoleOutputRef.current
      element.scrollTop = element.scrollHeight
    }
  }, [ logs ])

  // Clear logs handler
  const clear_handler = async () => {
    LogStore.clear().then(() => setLogs([]))
  }

  // Reset node handler
  const reset_handler = async () => {
    try {
      // Still send message to reset the node
      await browser.runtime.sendMessage({ type: MESSAGE_TYPE.NODE_RESET })
    } catch (error) {
      console.error('error resetting node:', error)
    }
  }

  return (
    <div className="container">
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
        <button className="button" onClick={clear_handler}>Clear Console</button>
        <button className="button button-reset" onClick={reset_handler}>Reset Node</button>
      </div>
    </div>
  );
}
