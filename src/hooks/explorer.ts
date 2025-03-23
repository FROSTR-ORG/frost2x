import useSWR from 'swr'

import type {
  ExplorerAddressInfo,
  ExplorerTxData,
  ExplorerUtxoData
} from '@/types/index.js'

const fetcher = (url : string) => fetch(url).then((res) => res.json())

export function useAddressInfo (
  host_url : string | null,
  address  : string | null
) {
  const url = (address !== null && host_url !== null)
    ? `${host_url}/address/${address}`
    : null
  return useSWR<ExplorerAddressInfo>(url, fetcher)
}

export function usePoolHistory (
  host_url : string | null,
  address  : string | null
) {
  const url = (address !== null && host_url !== null)
    ? `${host_url}/address/${address}/txs/mempool`
    : null
  return useSWR<ExplorerTxData[]>(url, fetcher)
}

export function useChainHistory (
  host_url : string | null,
  address  : string | null
) {
  const url = (address !== null && host_url !== null)
    ? `${host_url}/address/${address}/txs/chain`
    : null
  return useSWR<ExplorerTxData[]>(url, fetcher)
}

export function useUtxoSet (
  host_url : string | null,
  address  : string | null
) {
  const url = (address !== null && host_url !== null)
    ? `${host_url}/address/${address}/utxo`
    : null
  return useSWR<ExplorerUtxoData[]>(url, fetcher)
}
