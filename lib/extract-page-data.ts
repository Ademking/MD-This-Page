import Defuddle from "defuddle"
import TurndownService from "turndown"

import type { PageData } from "./format"

const turndown = new TurndownService()
const REMOVABLE_SELECTORS =
  'script, style, link, noscript, svg, [aria-hidden="true"]'

function toMarkdown(html: string): string {
  return turndown.turndown(html).trim()
}

function convertExtractedHtml(content: string, doc: Document): string {
  const extractedMarkdown = content.trim() ? toMarkdown(content) : ""

  if (extractedMarkdown) {
    return extractedMarkdown
  }

  const clone = doc.cloneNode(true) as Document

  clone
    .querySelectorAll(REMOVABLE_SELECTORS)
    .forEach((element) => element.remove())

  const main =
    clone.querySelector('[role="main"]') ||
    clone.querySelector("main") ||
    clone.querySelector("article") ||
    clone.body

  return toMarkdown(main?.innerHTML || "")
}

export function extractPageData(doc: Document, pageUrl: string): PageData {
  const defuddle = new Defuddle(doc, {
    url: pageUrl,
    removeExactSelectors: true
  })

  const result = defuddle.parse()

  return {
    markdown: convertExtractedHtml(result?.content || "", doc),
    title: result?.title || doc.title,
    author: result?.author || "",
    date: result?.published || "",
    url: pageUrl,
    domain: result?.domain || new URL(pageUrl).hostname,
    raw: result
  }
}
