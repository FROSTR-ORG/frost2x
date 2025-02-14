import { get_node }   from './src/node.js'
import { NostrRelay } from './src/relay.js'

const node  = get_node()
const relay = new NostrRelay(8002)

node.client.on('ready', () => {
  console.log('node connected')
})

relay.onconnect(() => {
  console.log('relay connected')
})

node.client.on('message', (message) => {
  console.log('message', message)
})

await relay.start()
await node.connect()
