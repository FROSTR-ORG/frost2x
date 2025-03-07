# Wallet.tsx BUILD INSTRUCTIONS

Please build the wallet.tsx component with the following features:

* A SignedAccount interface for vendors to store user-approved addresses:
  interface SignedAccount {
    address : {
      payment : string
      change  : string
      meta    : string
    }
    expires_at : number
    id         : string
    origin     : string
    pubkey     : string
    signature  : string
  }

* A browser window API interface to access the wallet:

  - get_accounts(): Promise<string>
  - get_balance(): Promise<number>
  - get_utxos(amount: number): Promise<string[]>
  - sign_psbt(psbt: string): Promise<string>

* A settings page with the following form fields:

  - Block Explorer URL:
  - Block Explorer Rate Limit (in milliseconds per request):
  - Chain Network

  - Transaction Priority Default:
  - Transaction Max Locktime (in blocks or seconds):
  - Transaction Max Fee Rate (in sat/vB):
  - Transaction Max Spend Amount (in sats):

* A Permissions Page with the ability to add/remove verified addresses. These addresses must include a host domain as the address's origin, and a signature which signs the domain URL of the address. This page should include the wallet's addresses by default, and have an export button (which exports the addresses with a signature from the wallet).

* An indexer that builds a database of the wallet's addresses, starting from index 0, and continuing until the index limit (default is the current index plus gap limit). Each index must include various address types (p2wpkh, p2tr) configured in the settings. This indexer should be able to be paused/resumed/reset.

* A crawler that scans the blockchain for utxos on the spending wallet's addresses, with a progress bar (based on index count), and a button to start/stop/reset the crawler.

* A crawler that scans the blockchain for transactions on the wallet's addresses (between the birth height and the current block), with a progress bar (based on address count), and a button to start/stop/reset the crawler.

* A crawler that scans the mempool for transactions on the wallet's addresses, with a progress bar (based on address count), and a button to start/stop/reset the crawler.

* A display of the following information:
  - The wallet's bitcoin balance onchain (in sats).
  - The wallet's bitcoin balance in the mempool (in sats).
  - A count of total transactions in the wallet's history.
  - A count of total addresses in the wallet's history.
  - A count of total UTXOs in the wallet's posession.
  - A total of all sats spent in the wallet's history.
  - A total of all sats received in the wallet's history.

* A list of addresses/utxos.

* A PSBT decoder, which decodes a PSBT and displays the details of the transaction it contains. This decoder should be able to scan the PSBT inputs, and detect if the input is owned by the spending wallet (using the spending wallet's utxo index). This should also be able to detect if a derivation path is provided in the PSBT, and if so, check if it belongs to the spending wallet. It should also scan the output addresses, and detect if they belong to the spending wallet, the invoice wallet, or any of the permissioned wallets.
