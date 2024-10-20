import { useState } from 'react'

import { bytesToHex, hexToBytes } from '@noble/hashes/utils'
import * as nip19 from 'nostr-tools/nip19'
import QRCode   from 'react-qr-code'
import QrReader from 'react-qr-scanner'
import browser  from 'webextension-polyfill'

interface Props {
  hidingPrivateKey : boolean
  privKeyInput     : string
}

export default function ({
  hidingPrivateKey,
} : Props) {
  let [privKey, setPrivKey]               = useState(null)
  let [privKeyInput, setPrivKeyInput]     = useState('')
  let [askPassword, setAskPassword]       = useState(null)
  let [password, setPassword]             = useState('')
  let [errorMessage, setErrorMessage]     = useState('')
  let [successMessage, setSuccessMessage] = useState('')
  let [qrcodeScanned, setQrCodeScanned] = useState(null)
  let [scanning, setScanning] = useState(false)
  let [warningMessage, setWarningMessage] = useState('')

  async function hideAndResetKeyInput() {
    setPrivKeyInput(privKey)
    hidePrivateKey(true)
  }

  async function handleKeyChange(e) {
    let key = e.target.value.toLowerCase().trim()
    setPrivKeyInput(key)

    try {
      let bytes = hexToBytes(key)
      if (bytes.length === 32) {
        key = nip19.nsecEncode(bytes)
        setPrivKeyInput(key)
      }
    } catch (err) {
      /***/
    }

    if (key.startsWith('ncryptsec1')) {
      // we won't save an encrypted key, will wait for the password
      setAskPassword('decrypt/save')
      return
    }

    try {
      // we will only save a key that is a valid nsec
      if (nip19.decode(key).type === 'nsec') {
        addUnsavedChanges('private_key')
      }
    } catch (err) {
      /***/
    }
  }

  async function saveKey() {
    if (!isKeyValid()) {
      showMessage('PRIVATE KEY IS INVALID! did not save private key.')
      return
    }
    let hexOrEmptyKey = privKeyInput
    try {
      let { type, data } = nip19.decode(privKeyInput)
      if (type === 'nsec') hexOrEmptyKey = bytesToHex(data)
    } catch (_) { }
    await browser.storage.local.set({
      private_key: hexOrEmptyKey
    })
    if (hexOrEmptyKey !== '') {
      setPrivKeyInput(nip19.nsecEncode(hexToBytes(hexOrEmptyKey)))
    }
    showMessage('saved private key!')
  }

  function isKeyValid() {
    if (privKeyInput === '') return true
    try {
      if (nip19.decode(privKeyInput).type === 'nsec') return true
    } catch (_) { }
    return false
  }

  return (
    <div>
      <div>secret key share:&nbsp;</div>
      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type={hidingPrivateKey ? 'password' : 'text'}
            style={{ width: '600px' }}
            value={privKeyInput}
            onChange={handleKeyChange}
          />
          {privKeyInput === '' && (
            <>
              {/* <button onClick={generate}>generate</button> */}
              <button onClick={() => setScanning(true)}>scan qrcode</button>
              <button onClick={loadQrCodeFromFile}>load qrcode</button>
            </>
          )}
          {privKeyInput && hidingPrivateKey && (
            <>
              {askPassword !== 'encrypt/display' && (
                <button onClick={() => hidePrivateKey(false)}>
                  show key
                </button>
              )}
              <button onClick={() => setAskPassword('encrypt/display')}>
                show key encrypted
              </button>
            </>
          )}

          {privKeyInput && !hidingPrivateKey && (
            <button onClick={hideAndResetKeyInput}>hide key</button>
          )}
        </div>
        {privKeyInput &&
          !privKeyInput.startsWith('ncryptsec1') &&
          !isKeyValid() && (
            <div style={{ color: 'red' }}>private key is invalid!</div>
          )}
        {!hidingPrivateKey &&
          privKeyInput !== '' &&
          (privKeyInput.startsWith('ncryptsec1') || isKeyValid()) && (
            <div
              style={{
                height: 'auto',
                maxWidth: 256,
                width: '100%',
                marginTop: '5px'
              }}
            >
              <QRCode
                size={256}
                style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                value={privKeyInput.toUpperCase()}
                viewBox={`0 0 256 256`}
              />
            </div>
          )}
        {scanning && (
          <QrReader
            style={{
              height: 240,
              width: 320,
            }}
            onError={error => {
              setErrorMessage('invalid qrcode')
              console.error(error)
              setScanning(false)
            }}
            onScan={scanned => setQrCodeScanned(scanned && scanned.text || null)}
          ></QrReader>
        )}
      </div>
      {warningMessage && <div style={{ color: 'red', marginTop: '10px' }}>{warningMessage}</div>}
    </div>
  )
}
