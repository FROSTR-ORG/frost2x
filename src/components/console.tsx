import browser          from 'webextension-polyfill'
import { LogStore }     from '@/stores/logs.js'
import { MESSAGE_TYPE } from '@/const.js'

import {
  useEffect,
  useState,
  useRef
} from 'react'

import type { LogEntry } from '../types/index.js'

export default function Console() {
  // Keep logs only in component state
  const [logs, setLogs] = useState<LogEntry[]>([])
  
  // Create a ref for the console output element
  const consoleOutputRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (consoleOutputRef.current) {
      const element     = consoleOutputRef.current
      element.scrollTop = element.scrollHeight
    }
  }, [ logs ])

  // Function to add a new log entry
  const addLog = (log: LogEntry) => {
    setLogs(prevLogs => [...prevLogs, log])
  }

  // Clear logs from memory only
  const clear = () => {
    setLogs([])
  }

  // Reset node but maintain in-memory approach
  const reset = () => {
    try {
      // Clear logs
      clear()
      // Still send message to reset the node
      browser.runtime.sendMessage({ type: 'node_reset' })
    } catch (error) {
      console.error('error resetting node:')
      console.error(error)
      
      // Add error to logs
      addLog({
        type      : 'error',
        message   : `Error resetting node: ${error}`,
        timestamp : new Date().toISOString()
      })
    }
  }

  // Example of how to listen for messages from background/content scripts
  useEffect(() => {
    const handleMessage = (message: any) => {
      // If the message contains a log entry, add it
      if (message.type === 'log') {
        addLog(message.data)
      }
      return undefined
    }
    
    // Set up listener for messages
    browser.runtime.onMessage.addListener(handleMessage)
    
    // Clean up on unmount
    return () => browser.runtime.onMessage.removeListener(handleMessage)
  }, [])

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
        <button className="button" onClick={clear}>Clear Console</button>
        <button className="button button-reset" onClick={reset}>Reset Node</button>
      </div>
    </div>
  );
}
