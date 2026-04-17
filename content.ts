import { isProbablyReaderable, Readability } from "@mozilla/readability"
import TurndownService from "turndown"
// @ts-ignore
import { gfm } from "turndown-plugin-gfm"

export {}

function convertPageToMarkdown() {
  // Clone the document so Readability doesn't mutate the original DOM
  const documentClone = document.cloneNode(true) as Document

  // Clean up common bad elements before Readability or Turndown processes them
  const badSelectors = [
    ".infobox",
    ".mw-editsection",
    ".navbox",
    ".metadata",
    ".reflist",
    ".reference",
    ".mw-empty-elt"
  ]
  badSelectors.forEach((selector) => {
    documentClone.querySelectorAll(selector).forEach((el) => el.remove())
  })

  let article: any = null
  try {
    if (isProbablyReaderable(documentClone)) {
      const reader = new Readability(documentClone)
      article = reader.parse()
    }
  } catch (error) {
    console.warn("Readability failed to parse this page:", error)
  }

  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced"
  })
  turndownService.use(gfm)

  // Ensure no scripts, styles, or common layout elements are extracted
  turndownService.remove([
    "script",
    "style",
    "noscript",
    "header",
    "footer",
    "nav",
    "aside",
    "svg",
    "iframe",
    "canvas",
    "form",
    "button",
    "dialog"
  ])

  // Ignore images that use base64 data URIs
  turndownService.addRule("ignoreBase64Images", {
    filter: function (node, options) {
      if (node.nodeName === "IMG") {
        const src = node.getAttribute("src") || ""
        if (src.startsWith("data:image")) {
          return true
        }
      }
      return false
    },
    replacement: function () {
      return ""
    }
  })

  // Fallback to the main generic wrapper if Readability isn't suitable or fails
  let htmlToConvert = ""
  if (article && article.content) {
    htmlToConvert = article.content
  } else {
    const mainEl =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("#main-content") ||
      document.querySelector("#main") ||
      document.querySelector("#content") ||
      document.querySelector(".content") ||
      document.body
    htmlToConvert = mainEl.innerHTML
  }

  let baseMd = turndownService.turndown(htmlToConvert)

  // Remove lines that contain only a solitary dash or middle dot (possibly with spaces)
  baseMd = baseMd.replace(/^[ \t]*[-·][ \t]*$/gm, "")

  // Clean up excess whitespace: more than 2 consecutive newlines should become exactly 2
  baseMd = baseMd.replace(/^[ \t]+$/gm, "")
  baseMd = baseMd.replace(/\n{3,}/g, "\n\n").trim()

  const pageData = {
    markdown: baseMd,
    title: article?.title || document.title || "",
    author: article?.byline || "",
    date: article?.publishedTime || "",
    url: window.location.href || ""
  }

  // Save the page info to local storage and open the tab page
  chrome.storage.local.set({ pageData }, () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to save page data:", chrome.runtime.lastError)
    }
    // Tell the background script to open a new tab with our markdown page
    // Using a message to background script ensures the URL is correct for the extension
    chrome.runtime.sendMessage({ action: "open-markdown-tab" })
  })
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convert-to-markdown") {
    convertPageToMarkdown()
  }
})
