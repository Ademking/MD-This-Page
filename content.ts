import Defuddle from "defuddle"
import TurndownService from "turndown"
// @ts-ignore
import { gfm } from "turndown-plugin-gfm"

export {}

function convertPageToMarkdown() {
  const documentClone = document.cloneNode(true) as Document

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
    const defuddle = new Defuddle(documentClone, { url: window.location.href })
    article = defuddle.parse()
  } catch (error) {
    console.warn("Defuddle failed to parse this page:", error)
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

  // Use Defuddle content HTML, convert with Turndown
  let baseMd = ""
  if (article?.content) {
    baseMd = turndownService.turndown(article.content)
  } else {
    const turndownService = new TurndownService({
      headingStyle: "atx",
      hr: "---",
      bulletListMarker: "-",
      codeBlockStyle: "fenced"
    })
    turndownService.use(gfm)

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

    const mainEl =
      document.querySelector("main") ||
      document.querySelector('[role="main"]') ||
      document.querySelector("#main-content") ||
      document.querySelector("#main") ||
      document.querySelector("#content") ||
      document.querySelector(".content") ||
      document.body
    const htmlToConvert = mainEl.innerHTML
    baseMd = turndownService.turndown(htmlToConvert)
  }

  // Remove lines that contain only a solitary dash or middle dot (possibly with spaces)
  baseMd = baseMd.replace(/^[ \t]*[-·][ \t]*$/gm, "")

  // Clean up excess whitespace: more than 2 consecutive newlines should become exactly 2
  baseMd = baseMd.replace(/^[ \t]+$/gm, "")
  baseMd = baseMd.replace(/\n{3,}/g, "\n\n").trim()

  const pageData = {
    markdown: baseMd,
    title: article?.title || document.title || "",
    author: article?.author || "",
    date: article?.datePublished || "",
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
