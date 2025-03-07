import useSWR from 'swr'

import { useStore } from '../components/store.js'

import type {
  ExplorerAddressInfo,
  ExplorerTxData,
  ExplorerUtxoData
} from '../types/index.js'

const fetcher = (url : string) => fetch(url).then((res) => res.json())

export function useAddressInfo (address : string | null) {
  const {
    'explorer/api_url': host_url,
  } = useStore().store.settings
  const url = (address !== null)
    ? `${host_url}/address/${address}`
    : null
  return useSWR<ExplorerAddressInfo>(url, fetcher)
}

export function usePoolHistory (address : string | null) {
  const {
    'explorer/api_url': host_url,
  } = useStore().store.settings
  const url  = (address !== null)
    ? `${host_url}/address/${address}/txs/mempool`
    : null
  return useSWR<ExplorerTxData[]>(url, fetcher)
}

export function useChainHistory (address : string | null) {
  const {
    'explorer/api_url': host_url,
  } = useStore().store.settings
  const url  = (address !== null)
    ? `${host_url}/address/${address}/txs/chain`
    : null
  return useSWR<ExplorerTxData[]>(url, fetcher)
}

export function useUtxoSet (address : string | null) {
  const {
    'explorer/api_url': host_url,
  } = useStore().store.settings
  const url = (address !== null)
    ? `${host_url}/address/${address}/utxo`
    : null
  return useSWR<ExplorerUtxoData[]>(url, fetcher)
}
