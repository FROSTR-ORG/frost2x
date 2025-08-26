import browser                     from 'webextension-polyfill'
import { sleep }                   from '@frostr/bifrost/util'
import { useEffect, useState }     from 'react'
import { MESSAGE_TYPE, PING_IVAL } from '@/const.js'

import type { PeerStatus } from '@/types/index.js'

export function usePeerStatus () {
  const [ is_init, setInit  ] = useState(false)
  const [ status, setStatus ] = useState<PeerStatus[]>([])

  const fetch_status = async () => {
    try {
      // Get the peers from the node.
      const res = await browser.runtime.sendMessage({ type: MESSAGE_TYPE.PEER_STATUS }) as { peers: PeerStatus[] }
      if (res === null || !Array.isArray(res.peers)) {
        setStatus([])
        return
      }
      setStatus(res.peers)
    } catch (error) {
      console.error('Failed to fetch peer status:', error)
      setStatus([])
    }
  }

  const ping_peer = async (pubkey: string) => {
    try {
      const res = await browser.runtime.sendMessage({ type: MESSAGE_TYPE.PEER_PING, params: [ pubkey ] }) as { result: PeerStatus[], error: string | null }
      if (res === null || res.error || !Array.isArray(res.result)) {
        setStatus([])
        return
      }
      setStatus(res.result)
    } catch (error) {
      console.error('Failed to ping peer:', error)
      setStatus([])
    }
  }

  useEffect(() => {
    if (status.length === 0 && !is_init) {
      (async () => {
        await sleep(500)
        await fetch_status()
        setInit(true)
      })()
    }
  }, [ status, is_init ])

  useEffect(() => {
    const interval = setInterval(fetch_status, PING_IVAL * 1000)
    return () => clearInterval(interval)
  }, [])

  return { status, ping_peer }
}
