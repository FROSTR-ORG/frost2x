import browser      from 'webextension-polyfill'
import { MAX_LOGS } from '../const.js'

import type { LogEntry } from '../types/index.js'

// Add a log to the store
export async function addLog(entry: LogEntry): Promise<void> {
  try {
    // Get current logs
    const { logs = [] } = await browser.storage.local.get('logs') as { logs: LogEntry[] }
    
    // Add new log and limit to MAX_LOGS entries
    const updatedLogs = [entry, ...logs].slice(0, MAX_LOGS)
    
    // Store updated logs
    await browser.storage.local.set({ logs: updatedLogs })
  } catch (error) {
    console.error('Failed to add log to store:', error)
  }
}

// Get all logs from the store
export async function getLogs(): Promise<LogEntry[]> {
  try {
    const { logs = [] } = await browser.storage.local.get('logs') as { logs: LogEntry[] }
    return logs
  } catch (error) {
    console.error('Failed to get logs from store:', error)
    return []
  }
}

// Clear all logs
export async function clearLogs(): Promise<void> {
  try {
    await browser.storage.local.set({ logs: [] })
  } catch (error) {
    console.error('Failed to clear logs from store:', error)
  }
}

// Listen for logs changes and notify consumers
export function subscribeToLogs(callback: (logs: LogEntry[]) => void): () => void {
  const listener = async (changes: any, areaName: string) => {
    if (areaName === 'local' && changes.logs) {
      callback(changes.logs.newValue || [])
    }
  }
  
  browser.storage.onChanged.addListener(listener)
  
  // Return unsubscribe function
  return () => {
    browser.storage.onChanged.removeListener(listener)
  }
} 