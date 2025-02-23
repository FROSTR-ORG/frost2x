import { get_node }   from '@/test/node.js'
import { NostrRelay } from '@/test/relay.js'

// Import our credentials from the credential file.
import CONFIG from '../config.json' assert { type: 'json' }

// Capture the param input by the user.
const param  = process.argv[2] ?? 'dev'

if (param.startsWith('relay') || param.startsWith('dev')) {
  // Initialize a new relay.
  const relay  = new NostrRelay(8002)
  // Print a message when connected.
  relay.onconnect(() => console.log('relay connected'))
  // Start the relay.
  await relay.start()
}

if (param.startsWith('node') || param.startsWith('dev')) {
  // Create a node using our credentials and relays.
  const node = get_node(CONFIG)
  // Connect the node to the relay.
  await node.connect()
}
