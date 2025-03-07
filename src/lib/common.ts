import browser from 'webextension-polyfill'

import type { NotificationParams } from '../types/index.js'

export async function showNotification (
  host   : string,
  answer : boolean,
  type   : string,
  params : NotificationParams
): Promise<void> {
  const { notifications } = await browser.storage.local.get('notifications') as {
    notifications?: boolean
  }
  if (notifications) {
    const action = answer ? 'allowed' : 'denied'
    await browser.notifications.create(undefined, {
      type: 'basic',
      title: `${type} ${action} for ${host}`,
      message: JSON.stringify(
        params?.event
          ? {
              kind: params.event.kind,
              content: params.event.content,
              tags: params.event.tags
            }
          : params,
        null,
        2
      ),
      iconUrl: 'icons/48x48.png'
    })
  }
}

export async function getPosition (
  width: number,
  height: number
): Promise<{top: number; left: number}> {
  let left = 0
  let top = 0

  try {
    const lastFocused = await browser.windows.getLastFocused() as browser.Windows.Window

    if (
      lastFocused &&
      lastFocused.top !== undefined &&
      lastFocused.left !== undefined &&
      lastFocused.width !== undefined &&
      lastFocused.height !== undefined
    ) {
      // Position window in the center of the lastFocused window
      top = Math.round(lastFocused.top + (lastFocused.height - height) / 2)
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
