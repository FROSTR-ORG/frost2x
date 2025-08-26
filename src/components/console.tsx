import browser          from 'webextension-polyfill'
import { LogStore }     from '@/stores/logs.js'
import { MESSAGE_TYPE } from '@/const.js'

import {
  useEffect,
  useState,
  useRef,
  useCallback
} from 'react'

import type { LogEntry } from '@/types/index.js'

// Component for individual log entries with expandable data
function LogEntryItem({ log, index }: { log: LogEntry, index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasData = log.data !== undefined && log.data !== null

  const toggleExpanded = useCallback(() => {
    if (hasData) {
      setIsExpanded(prev => !prev)
    }
  }, [hasData])

  const formatData = useCallback((data: any) => {
    try {
      return JSON.stringify(data, null, 2)
    } catch (error) {
      // Handle circular references or non-serializable data
      try {
        const dataType = typeof data
        const isArray = Array.isArray(data)
        const constructorName = data?.constructor?.name
        
        return `Unable to serialize data
Type: ${isArray ? 'Array' : dataType}${constructorName ? ` (${constructorName})` : ''}
Error: ${error instanceof Error ? error.message : 'Circular reference or non-serializable data'}`
      } catch {
        return 'Error: Unable to format data'
      }
    }
  }, [])

  // Only compute formatted data when expanded and has data
  const formattedData = isExpanded && hasData ? formatData(log.data) : undefined

  return (
    <div className="console-entry-wrapper">
      <div 
        className={`console-entry console-${log.type} ${hasData ? 'console-entry-clickable' : ''}`}
        onClick={toggleExpanded}
      >
        {hasData && (
          <span className="console-expand-icon">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        <span className="console-timestamp">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
        <span className="console-message">{log.message}</span>
      </div>
      {isExpanded && hasData && formattedData !== undefined && (
        <div className="console-data-wrapper">
          <pre className="console-data">
            {formattedData}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function Console() {
  // State for logs
  const [ logs, setLogs ] = useState<LogEntry[]>([])
  
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
            <LogEntryItem key={idx} log={log} index={idx} />
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
