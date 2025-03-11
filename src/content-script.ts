import browser from 'webextension-polyfill'

// inject the script that will provide window.nostr
let nostr_provider = document.createElement('script')
nostr_provider.setAttribute('async', 'false')
nostr_provider.setAttribute('type', 'text/javascript')
nostr_provider.setAttribute('src', browser.runtime.getURL('nostr-provider.build.js'))
document.head.appendChild(nostr_provider)

let bitcoin_provider = document.createElement('script')
bitcoin_provider.setAttribute('async', 'false')
bitcoin_provider.setAttribute('type', 'text/javascript')
bitcoin_provider.setAttribute('src', browser.runtime.getURL('bitcoin-provider.build.js'))
document.head.appendChild(bitcoin_provider)

// listen for messages from that script
window.addEventListener('message', async message => {
  if (message.source !== window) return
  if (!message.data) return
  if (!message.data.params) return
  if (message.data.ext !== 'frost2x') return

  // pass on to background
  var response
  try {
    response = await browser.runtime.sendMessage({
      type: message.data.type,
      params: message.data.params,
      host: location.host
    })
  } catch (error) {
    response = {error}
  }

  // return response
  window.postMessage(
    {id: message.data.id, ext: 'frost2x', response},
    message.origin
  )
})
