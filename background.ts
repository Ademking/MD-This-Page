import { asPrompt, formatMarkdown, type PageData } from "~lib/format"
import { getSettings, type QuickAction } from "~lib/settings"

export {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "convert-to-markdown",
    title: ".MD this page",
    contexts: ["page", "action"]
  })
  chrome.contextMenus.create({
    id: "copy-markdown",
    title: "Copy Markdown",
    contexts: ["page", "action"]
  })
  chrome.contextMenus.create({
    id: "copy-as-prompt",
    title: "Copy as Prompt",
    contexts: ["page", "action"]
  })
  chrome.contextMenus.create({
    id: "download-md",
    title: "Download .MD",
    contexts: ["page", "action"]
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return
  switch (info.menuItemId) {
    case "convert-to-markdown":
      openFullTab(tab.id)
      break
    case "copy-markdown":
      runQuickAction(tab.id, "copy")
      break
    case "copy-as-prompt":
      runQuickAction(tab.id, "copyPrompt")
      break
    case "download-md":
      runQuickAction(tab.id, "download")
      break
  }
})

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === "convert-to-markdown" && tab?.id) {
    openFullTab(tab.id)
  }
})

// Left-click on the toolbar icon: either run the configured quick action, or
// fall back to the full preview tab if the user hasn't enabled one-click mode.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return
  const settings = await getSettings()
  if (settings.oneClickEnabled) {
    runQuickAction(tab.id, settings.oneClickAction)
  } else {
    openFullTab(tab.id)
  }
})

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "open-markdown-tab") {
    chrome.tabs.create({ url: chrome.runtime.getURL("tabs/markdown.html") })
  }
})

function openFullTab(tabId: number) {
  chrome.tabs
    .sendMessage(tabId, { action: "convert-to-markdown" })
    .catch((err) =>
      console.log("Content script not ready or an extension page.", err)
    )
}

async function runQuickAction(tabId: number, action: QuickAction) {
  try {
    const settings = await getSettings()
    const pageData = (await chrome.tabs.sendMessage(tabId, {
      action: "extract-page-data"
    })) as PageData
    const markdown = formatMarkdown(pageData, settings.format)

    if (action === "download") {
      await downloadMarkdown(markdown, pageData.title)
    } else {
      await copyToClipboard(
        action === "copyPrompt" ? asPrompt(markdown) : markdown
      )
    }
    showBadge("✓", "#10b981")
  } catch (err) {
    console.error("Quick action failed:", err)
    showBadge("!", "#ef4444")
  }
}

async function downloadMarkdown(markdown: string, title: string) {
  const filename = `${(title || "page").replace(/[\\/:*?"<>|]+/g, "_").trim() || "page"}.md`
  const dataUrl =
    "data:text/markdown;charset=utf-8," + encodeURIComponent(markdown)
  await chrome.downloads.download({ url: dataUrl, filename, saveAs: false })
}

let creatingOffscreen: Promise<void> | null = null

async function ensureOffscreenDocument() {
  if (!chrome.offscreen) {
    throw new Error(
      "Clipboard quick actions require the chrome.offscreen API, which this browser doesn't support."
    )
  }
  if (await chrome.offscreen.hasDocument()) return

  if (!creatingOffscreen) {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: chrome.runtime.getURL("tabs/offscreen.html"),
      reasons: [chrome.offscreen.Reason.CLIPBOARD],
      justification: "Write extracted markdown to the clipboard"
    })
  }
  await creatingOffscreen
  creatingOffscreen = null
}

async function copyToClipboard(text: string) {
  await ensureOffscreenDocument()
  const response = await chrome.runtime.sendMessage({
    target: "offscreen",
    action: "copy-to-clipboard",
    text
  })
  if (!response?.success) {
    throw new Error(response?.error || "Clipboard write failed")
  }
}

function showBadge(text: string, color: string) {
  chrome.action.setBadgeText({ text })
  chrome.action.setBadgeBackgroundColor({ color })
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500)
}
