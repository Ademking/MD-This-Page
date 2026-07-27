import Defuddle from "defuddle"
import TurndownService from "turndown"

import type { PageData } from "~lib/format"

const turndown = new TurndownService()

function extractPageData(): PageData {
  const defuddle = new Defuddle(document, {
    url: location.href,
    removeExactSelectors: true
  })

  const result = defuddle.parse()

  let markdown = ""
  if (result?.content && result.content.trim().length > 0) {
    markdown = turndown.turndown(result.content).trim()
  }

  if (!markdown) {
    document
      .querySelectorAll('script, style, link, noscript, svg, [aria-hidden="true"]')
      .forEach((el) => el.remove())
    const body =
      document.querySelector('[role="main"]') ||
      document.querySelector("main") ||
      document.querySelector("article") ||
      document.body
    markdown = turndown.turndown(body?.innerHTML || "").trim()
  }

  return {
    markdown,
    title: result?.title || document.title,
    author: result?.author || "",
    date: result?.published || "",
    url: location.href,
    domain: result?.domain || location.hostname,
    raw: result
  }
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
    try {
      chrome.runtime.sendMessage({
        action: "open-markdown-tab",
        pageData: extractPageData()
      })
    } catch (error) {
      console.error("Markdown conversion failed:", error)
    }
  } else if (request.action === "extract-page-data") {
    try {
      sendResponse(extractPageData())
    } catch (error) {
      console.error("Markdown conversion failed:", error)
      sendResponse(null)
    }
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
