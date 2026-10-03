interface MarkdownPageApi {
  runtime: Pick<typeof chrome.runtime, "getURL">
  tabs: Pick<typeof chrome.tabs, "create">
  windows: {
    create: (
      createData?: chrome.windows.CreateData
    ) => Promise<chrome.windows.Window | undefined>
  }
}

/**
 * Opens the preview page for a conversion. Arc (and some other Chromium
 * forks) block chrome.tabs.create() from the service worker, so fall back to
 * a popup window there.
 */
export async function openMarkdownPage(
  previewId: string,
  sourceTab?: chrome.tabs.Tab,
  api: MarkdownPageApi = chrome
): Promise<chrome.tabs.Tab | undefined> {
  const url = api.runtime.getURL(
    `tabs/markdown.html?id=${encodeURIComponent(previewId)}`
  )

  try {
    return await api.tabs.create({
      url,
      ...(sourceTab && sourceTab.index >= 0
        ? { index: sourceTab.index + 1, windowId: sourceTab.windowId }
        : {})
    })
  } catch {
    try {
      return await api.tabs.create({ url })
    } catch {
      const popup = await api.windows.create({
        url,
        type: "popup",
        width: 1200,
        height: 900
      })

      return popup?.tabs?.[0]
    }
  }
}
