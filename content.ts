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

function downloadMarkdown(markdown: string, filename: string) {
  // Done here rather than via chrome.downloads.download() with a data: URL
  // from the background: Firefox refuses "Access denied" for data: URLs
  // requested by a background script, even though Chrome allows it. A plain
  // Blob + <a download> in the page works identically in both browsers and
  // needs no "downloads" permission at all.
  const blob = new Blob([markdown], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
  } else if (request.action === "download-markdown") {
    try {
      downloadMarkdown(request.markdown ?? "", request.filename ?? "page.md")
      sendResponse({ success: true })
    } catch (err) {
      sendResponse({ success: false, error: String(err) })
    }
  }
})
