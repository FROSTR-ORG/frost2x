import { useState }  from 'react'
import { QRCodeSVG } from 'qrcode.react'

import * as Icons from '../icons.js'

interface Props {
  address     : string | null
  showMessage : (msg: string) => void
} 

export default function Address({ address, showMessage }: Props) {
  const [ copySuccess, setCopySuccess] = useState(false)
  const [ showQR, setShowQR          ] = useState(false)
  
  const copyAddressToClipboard = async () => {
    if (!address) return
    
    try {
      await navigator.clipboard.writeText(address)
      setCopySuccess(true)
      showMessage('Address copied to clipboard')
      
      // Reset copy success after 2 seconds
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy address:', err)
      showMessage('Failed to copy address')
    }
  }
  
  // Toggle QR code display
  const toggleQRCode = () => {
    setShowQR(!showQR)
  }
  
  return (
    <div className="address-container">
      <h3 className="settings-group-title">Payment Address</h3>
      
      <div className={`address-display ${showQR ? 'with-qr' : ''}`}>
        {address ? (
          <>
            <div className="address-value">
              <span>{address}</span>
            </div>
            
            <div className="address-actions">
              <button 
                className={`qr-button ${showQR ? 'active' : ''}`}
                onClick={toggleQRCode}
                title={showQR ? "Hide QR Code" : "Show QR Code"}
              >
                <Icons.QrCodeIcon />
              </button>
              
              <button 
                className={`copy-button ${copySuccess ? 'copy-success' : ''}`}
                onClick={copyAddressToClipboard}
                title="Copy address to clipboard"
              >
                {copySuccess ? (
                  <Icons.CheckIcon />
                ) : (
                  <Icons.CopyIcon />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="address-loading">
            <span>No address available</span>
          </div>
        )}
      </div>
      
      {/* QR Code displayed inline when toggled */}
      {showQR && address && (
        <div className="qr-connected-container">
          <div className="qr-connector"></div>
          <div className="qr-code-wrapper">
            <QRCodeSVG 
              value={address} 
              size={160}
              bgColor={"#ffffff"}
              fgColor={"#000000"}
              level={"L"}
              includeMargin={true}
              className="qr-code-svg"
            />
          </div>
        </div>
      )}
    </div>
  )
}
