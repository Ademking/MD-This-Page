import { Defuddle } from "defuddle-js"

async function convertPageToMarkdown() {
  let article: any = null
  try {
    const html = document.documentElement.outerHTML

    article = Defuddle.parse(html, { url: window.location.href })
  } catch (_) {}

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
    url: window.location.href || "",
    readyAt: Date.now()
  }

  chrome.storage.local.set({ pageData })
}

chrome.runtime.onMessage.addListener((request: any) => {
  if (request.action === "convert-to-markdown") {
    convertPageToMarkdown()
  }
})

export {}
