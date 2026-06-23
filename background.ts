function openMarkdownTab(): Promise<chrome.tabs.Tab> {
  const url = chrome.runtime.getURL("tabs/markdown.html")

  return chrome.tabs
    .create({ url })
    .catch(() =>
      chrome.windows
        .create({ url, type: "popup", width: 1200, height: 900 })
        .then((win) => win.tabs?.[0]!)
    )
}

function sendConvertMessage(tabId: number) {
  chrome.tabs
    .sendMessage(tabId, { action: "convert-to-markdown" })
    .catch(() => {})
    .finally(() => openMarkdownTab())
}

export {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convert-to-markdown",
    title: ".MD this page",
    contexts: ["page"]
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "convert-to-markdown" && tab?.id) {
    sendConvertMessage(tab.id)
  }
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "convert-to-markdown" && tab?.id) {
    sendConvertMessage(tab.id)
  }
})

chrome.action.onClicked.addListener((tab) => {
  if (tab?.id) {
    sendConvertMessage(tab.id)
  }
})
