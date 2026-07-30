import { extractPageData } from "~lib/extract-page-data"

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
        pageData: extractPageData(document, location.href)
      })
    } catch (error) {
      console.error("Markdown conversion failed:", error)
    }
  } else if (request.action === "extract-page-data") {
    try {
      sendResponse(extractPageData(document, location.href))
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
