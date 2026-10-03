interface MarkdownPageApi {
  runtime: Pick<typeof chrome.runtime, "getURL">
  tabs: Pick<typeof chrome.tabs, "create">
  windows: {
    create: (
      createData?: chrome.windows.CreateData
    ) => Promise<chrome.windows.Window | undefined>
  }
}

export async function openMarkdownPage(
  api: MarkdownPageApi = chrome
): Promise<chrome.tabs.Tab | undefined> {
  const url = api.runtime.getURL("tabs/markdown.html")

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
