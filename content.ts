import { Defuddle } from "defuddle-js"

import type { PageData } from "~lib/format"

export {}

function extractPageData(): PageData {
  let article: any = null
  try {
    const html = document.documentElement.outerHTML
    article = Defuddle.parse(html, { url: window.location.href })
  } catch (error) {
    console.warn("Defuddle failed to parse this page:", error)
  }

  let baseMd = ""
  if (article?.contentMarkdown) {
    baseMd = article.contentMarkdown
  } else if (article?.content) {
    baseMd = article.content
  }

  return {
    markdown: baseMd,
    title: article?.title || document.title || "",
    author: article?.author || "",
    date: article?.datePublished || "",
    url: window.location.href || ""
  }
}

function convertPageToMarkdown() {
  const pageData = extractPageData()

  chrome.storage.local.set({ pageData }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to save page data:", chrome.runtime.lastError)
    }
    chrome.runtime.sendMessage({ action: "open-markdown-tab" })
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convert-to-markdown") {
    convertPageToMarkdown()
  } else if (request.action === "extract-page-data") {
    sendResponse(extractPageData())
  } else if (request.action === "copy-to-clipboard") {
    // Done here rather than from a background offscreen document: an
    // offscreen document never has focus, so navigator.clipboard.writeText()
    // always throws NotAllowedError there. The page's own document does
    // have focus when the user triggers this via the context menu or the
    // toolbar icon, so the write succeeds here.
    navigator.clipboard
      .writeText(request.text ?? "")
      .then(() => sendResponse({ success: true }))
      .catch((err) =>
        sendResponse({ success: false, error: `${err.name}: ${err.message}` })
      )
    return true
  }
})
