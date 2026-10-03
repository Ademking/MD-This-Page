import Defuddle, { createMarkdownContent } from "defuddle/full"

import type { PageData } from "./format"

// Elements that never carry readable content in the whole-page fallback.
const NOISE_SELECTORS =
  'script, style, link, meta, noscript, template, svg, canvas, iframe, nav, [aria-hidden="true"], [hidden]'

// Client-side rendered apps (Angular, React, Vue...) may still be painting
// their content when the user triggers the extension. Below this amount of
// visible text we briefly wait for the DOM to settle before extracting.
const MIN_RENDERED_TEXT = 200
const RENDER_TIMEOUT_MS = 4000
const RENDER_QUIET_MS = 400

// Defuddle is built for articles. On app-like pages (dashboards, landing
// pages, chat UIs...) it can pick a tiny fragment. When its output is this
// small compared with what is actually visible, fall back to the whole page.
const MIN_EXTRACTED_WORDS = 150
const FALLBACK_RATIO = 3

function visibleText(doc: Document): string {
  return (doc.body?.innerText || "").replace(/\s+/g, " ").trim()
}

function countWords(text: string): number {
  const matches = text.match(/[\p{L}\p{N}]+/gu)
  return matches ? matches.length : 0
}

function waitForRenderedContent(doc: Document): Promise<void> {
  if (visibleText(doc).length >= MIN_RENDERED_TEXT || !doc.body) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    let quietTimer: ReturnType<typeof setTimeout> | undefined
    const finish = () => {
      observer.disconnect()
      clearTimeout(quietTimer)
      clearTimeout(hardTimer)
      resolve()
    }
    const observer = new MutationObserver(() => {
      clearTimeout(quietTimer)
      if (visibleText(doc).length >= MIN_RENDERED_TEXT) {
        quietTimer = setTimeout(finish, RENDER_QUIET_MS)
      }
    })
    const hardTimer = setTimeout(finish, RENDER_TIMEOUT_MS)
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
      characterData: true
    })
  })
}

/**
 * Deep-clones `root`, dropping every element that isn't visible in the live
 * page. The clone is never rendered, so visibility has to be read from the
 * live elements; both trees list their elements in the same order.
 */
function cloneVisible<T extends Element>(root: T): T {
  const hidden: boolean[] = []
  root.querySelectorAll<HTMLElement>("*").forEach((el, index) => {
    hidden[index] =
      typeof el.checkVisibility === "function"
        ? !el.checkVisibility()
        : el.offsetParent === null && getComputedStyle(el).position !== "fixed"
  })

  const clone = root.cloneNode(true) as T
  const toRemove: Element[] = []
  clone.querySelectorAll("*").forEach((el, index) => {
    if (hidden[index]) toRemove.push(el)
  })
  toRemove.forEach((el) => el.remove())
  return clone
}

// Rich-text editors (Quill, etc.) sometimes wrap whole documents in a <pre>,
// which would otherwise come out as one giant code block (issue #8). Real
// code blocks never contain headings, paragraphs, lists or tables.
const PROSE_IN_PRE = "h1, h2, h3, h4, h5, h6, p, ul, ol, table, blockquote"

function hasProseInPre(doc: Document): boolean {
  return Array.from(doc.querySelectorAll("pre")).some((pre) =>
    pre.querySelector(PROSE_IN_PRE)
  )
}

/** A detached copy of `doc` with hidden elements removed and prose <pre>s unwrapped. */
function prepareProseDocument(doc: Document): Document {
  const clone = doc.cloneNode(true) as Document
  if (doc.body && clone.body) clone.body.replaceWith(cloneVisible(doc.body))

  clone.querySelectorAll("pre").forEach((pre) => {
    if (!pre.querySelector(PROSE_IN_PRE)) return
    const div = clone.createElement("div")
    div.className = pre.className
    div.append(...Array.from(pre.childNodes))
    pre.replaceWith(div)
  })
  return clone
}

/**
 * Converts the whole rendered page (minus obvious chrome) to Markdown.
 * Works on a clone so the user's page is never modified.
 */
function wholePageMarkdown(doc: Document, pageUrl: string): string {
  const root = doc.querySelector<HTMLElement>('main, [role="main"]') || doc.body
  if (!root) return ""

  const clone = cloneVisible(root)
  clone.querySelectorAll(NOISE_SELECTORS).forEach((el) => el.remove())
  return createMarkdownContent(clone.innerHTML, pageUrl).trim()
}

export async function extractPageData(
  doc: Document,
  pageUrl: string
): Promise<PageData> {
  await waitForRenderedContent(doc)

  let result: ReturnType<Defuddle["parse"]> | null = null
  try {
    const source = hasProseInPre(doc) ? prepareProseDocument(doc) : doc
    result = new Defuddle(source, {
      url: pageUrl,
      markdown: true,
      // Never let Defuddle call third-party APIs from the user's page.
      useAsync: false
    }).parse()
  } catch (error) {
    console.warn("[.MD this page] Defuddle failed, using fallback:", error)
  }

  let markdown = (result?.content || "").trim()
  const extractedWords = countWords(markdown)
  const pageWords = countWords(visibleText(doc))

  if (
    !markdown ||
    (extractedWords < MIN_EXTRACTED_WORDS &&
      pageWords > extractedWords * FALLBACK_RATIO)
  ) {
    const fallback = wholePageMarkdown(doc, pageUrl)
    if (countWords(fallback) > extractedWords) markdown = fallback
  }

  let domain = result?.domain || ""
  try {
    domain ||= new URL(pageUrl).hostname
  } catch {
    // Non-URL documents keep an empty domain.
  }

  let favicon = ""
  try {
    const resolved = new URL(result?.favicon || "/favicon.ico", pageUrl)
    if (/^(https?|data):$/.test(resolved.protocol)) favicon = resolved.href
  } catch {
    // Leave the favicon empty.
  }

  return {
    markdown,
    title: result?.title || doc.title || "",
    author: result?.author || "",
    date: result?.published || "",
    description: result?.description || "",
    url: pageUrl,
    domain,
    favicon,
    wordCount: countWords(markdown)
  }
}
