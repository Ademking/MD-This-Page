import Defuddle from "defuddle"
import TurndownService from "turndown"

const turndown = new TurndownService()

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "convert-to-markdown") {
    try {
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
          .querySelectorAll(
            'script, style, link, noscript, svg, [aria-hidden="true"]'
          )
          .forEach((el) => el.remove())
        const body =
          document.querySelector('[role="main"]') ||
          document.querySelector("main") ||
          document.querySelector("article") ||
          document.body
        markdown = turndown.turndown(body?.innerHTML || "").trim()
      }

      chrome.runtime.sendMessage({
        action: "open-markdown-tab",
        pageData: {
          markdown,
          title: result?.title || document.title,
          author: result?.author || "",
          date: result?.published || "",
          url: location.href,
          domain: result?.domain || location.hostname,
          raw: result
        }
      })
    } catch (error) {
      console.error("Markdown conversion failed:", error)
    }
  }
})
