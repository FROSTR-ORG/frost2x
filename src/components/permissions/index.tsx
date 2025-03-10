import AddressPermissions from './address.js'
import EventPermissions   from './events.js'
import WalletPermissions  from './wallet.js'

interface PermissionsProps {
  showMessage: (msg: string) => void
}

export default function Permissions({ showMessage }: PermissionsProps) {
  return (
    <div>
      <AddressPermissions showMessage={showMessage} />
      <div className="section-separator"></div>
      <EventPermissions showMessage={showMessage} />
      <div className="section-separator"></div>
      <WalletPermissions showMessage={showMessage} />
      <div className="section-separator"></div>
    </div>
  )
}
