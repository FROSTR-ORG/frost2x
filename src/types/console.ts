export interface LogEntry {
  timestamp : string
  message   : string
  type      : 'info' | 'error' | 'warning' | 'success'
  data?     : any
}
