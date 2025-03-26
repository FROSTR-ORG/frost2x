import browser from 'webextension-polyfill'

export async function showNotification (
  host   : string,
  policy : boolean,
  method : string,
  params : Record<string, unknown>
): Promise<void> {
  const action  = policy ? 'allowed' : 'denied'
  const title   = `${method} ${action} for ${host}`
  const message = JSON.stringify(params, null, 2)
  await browser.notifications.create(undefined, {
    type: 'basic',
    title,
    message,
    iconUrl: 'icons/48x48.png'
  })
}

export async function getPosition (
  width  : number,
  height : number
): Promise<{top: number; left: number}> {
  let left = 0
  let top  = 0

  try {
    const lastFocused = await browser.windows.getLastFocused() as browser.Windows.Window

    if (
      lastFocused                      &&
      lastFocused.top    !== undefined &&
      lastFocused.left   !== undefined &&
      lastFocused.width  !== undefined &&
      lastFocused.height !== undefined
    ) {
      // Position window in the center of the lastFocused window
      top  = Math.round(lastFocused.top + (lastFocused.height - height) / 2)
      left = Math.round(lastFocused.left + (lastFocused.width - width) / 2)
    } else {
      console.error('Last focused window properties are undefined.')
    }
  } catch (error) {
    console.error('Error getting window position:', error)
  }

  return {
    top,
    left
  }
}
