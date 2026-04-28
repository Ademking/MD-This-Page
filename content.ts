import { Defuddle } from "defuddle-js"

export {}

function convertPageToMarkdown() {
  let article: any = null
  try {
    const parser = new DOMParser()
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

  const pageData = {
    markdown: baseMd,
    title: article?.title || document.title || "",
    author: article?.author || "",
    date: article?.datePublished || "",
    url: window.location.href || ""
  }

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
  }
})
