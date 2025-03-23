import GroupPackageConfig    from './group.js'
import PeerNodeConfig        from './peers.js'
import RelayConfig           from './relays.js'
import SecretPackageConfig   from './share.js'

export default function () {

  return (
    <>
      <SecretPackageConfig />
      <GroupPackageConfig  />
      <PeerNodeConfig      />
      <RelayConfig         />
    </>
  )
}
