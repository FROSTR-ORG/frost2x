import SignerPermissions  from './signer.js'
import WalletPermissions  from './wallet.js'

export default function Permissions() {
  return (
    <>
      <SignerPermissions />
      {/* <div className="section-separator"></div> */}
      {/* <WalletPermissions showMessage={showMessage} /> */}
      {/* <div className="section-separator"></div> */}
    </>
  )
}
