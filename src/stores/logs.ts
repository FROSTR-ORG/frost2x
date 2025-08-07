import browser      from 'webextension-polyfill'
import { MAX_LOGS } from '@/const.js'

import type { LogEntry } from '@/types/index.js'

export namespace LogStore {

  // Add a log to the store
  export async function add (
    message : string,
    type    : 'info' | 'error' | 'warning' | 'success',
    data?   : any
  ) : Promise<void> {
    const timestamp = new Date().toISOString()
    const entry     = { timestamp, message, type, ...(data && { data }) }
    // Get current logs
    const logs = await fetch()
    // Add new log and limit to MAX_LOGS entries
    const slice_index = logs.length - MAX_LOGS
    const updatedLogs = [ ...logs, entry ].slice(slice_index)
    // Store updated logs
    return browser.storage.local.set({ logs: updatedLogs })
  }

  export async function fetch () : Promise<LogEntry[]> {
    return browser.storage.local
      .get('logs')
      .then(res => (res.logs ?? []) as LogEntry[])
  }

  // Clear all logs
  export async function clear(): Promise<void> {
    return browser.storage.local.set({ logs: [] })
  }

  // Listen for logs changes and notify consumers
  export function subscribe (callback: (logs: LogEntry[]) => void): () => void {
    const listener = async (changes: any, areaName: string) => {
      if (areaName === 'local' && changes.logs) {
        callback(changes.logs.newValue || [])
      }
    }
    // Listen for logs changes.
    browser.storage.onChanged.addListener(listener)
    // Return unsubscribe function
    return () => {
      browser.storage.onChanged.removeListener(listener)
    }
  }
}
