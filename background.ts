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
    chrome.tabs
      .sendMessage(tab.id, { action: "convert-to-markdown" })
      .catch((err) =>
        console.log("Content script not ready or an extension page.", err)
      )
  }
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "convert-to-markdown") {
    if (tab?.id) {
      chrome.tabs
        .sendMessage(tab.id, { action: "convert-to-markdown" })
        .catch((err) => console.log("Content script not ready.", err))
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs
            .sendMessage(tabs[0].id, { action: "convert-to-markdown" })
            .catch((err) => console.log("Content script not ready.", err))
        }
      })
    }
  }
})

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "open-markdown-tab") {
    // Open the new tab page provided by Plasmo
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/markdown.html") })
  }
})
