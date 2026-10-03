export interface PageData {
  markdown: string
  title: string
  author: string
  date: string
  url: string
  domain?: string
  description?: string
  favicon?: string
  wordCount?: number
}

export interface FormatSettings {
  includeImages: boolean
  includeLinks: boolean
  includePageInfo: boolean
  includeMap: boolean
  includeSourceUrl: boolean
}

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  includeImages: false,
  includeLinks: false,
  includePageInfo: true,
  includeMap: true,
  includeSourceUrl: true
}

// A Markdown link/image destination, allowing one level of balanced
// parentheses (e.g. Wikipedia URLs like /wiki/Field_(physics)) and an
// optional "title".
const DESTINATION = String.raw`\((?:[^()\s]|\([^()\s]*\))*(?:\s+"[^"]*")?\)`
const IMAGE_RE = new RegExp(String.raw`!\[[^\]]*\]` + DESTINATION, "g")
const LINK_RE = new RegExp(String.raw`(?<!!)\[([^\]]*)\]` + DESTINATION, "g")
const FENCE_RE = /^\s*(```|~~~)/

interface HeadingNode {
  text: string
  level: number
  children: HeadingNode[]
}

/** Runs `transform` on everything except fenced code blocks. */
function outsideCodeBlocks(
  markdown: string,
  transform: (text: string) => string
): string {
  const parts = markdown.split(
    /(^[ \t]*(?:```|~~~)[\s\S]*?^[ \t]*(?:```|~~~)[ \t]*$)/m
  )
  return parts
    .map((part, index) => (index % 2 === 1 ? part : transform(part)))
    .join("")
}

function extractHeadings(markdown: string) {
  const headings: { level: number; text: string }[] = []
  let inFence = false

  markdown.split("\n").forEach((line) => {
    if (FENCE_RE.test(line)) {
      inFence = !inFence
      return
    }
    if (inFence) return
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (match) {
      const text = match[2].replace(LINK_RE, "$1").replace(/[*_`]/g, "").trim()
      if (text) headings.push({ level: match[1].length, text })
    }
  })

  return headings
}

export function generatePageMap(
  markdown: string,
  title: string = "Document Structure"
): string {
  const headings = extractHeadings(markdown)
  if (headings.length === 0) return ""

  const root: HeadingNode = { text: title, level: 0, children: [] }
  const stack: HeadingNode[] = [root]

  headings.forEach((h) => {
    const node: HeadingNode = { text: h.text, level: h.level, children: [] }
    while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
      stack.pop()
    }
    stack[stack.length - 1].children.push(node)
    stack.push(node)
  })

  let mapStr = `${title}\n`

  function renderChildren(node: HeadingNode, prefix: string) {
    node.children.forEach((child, index) => {
      const isLast = index === node.children.length - 1
      mapStr += `${prefix}${isLast ? "└── " : "├── "}${child.text}\n`
      renderChildren(child, prefix + (isLast ? "    " : "│   "))
    })
  }

  renderChildren(root, "")

  return "# Page Structure Map\n```text\n" + mapStr.trimEnd() + "\n```\n"
}

function formatDate(date: string): string {
  const parsed = new Date(date)
  return isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString()
}

export function formatMarkdown(
  pageData: PageData,
  settings: FormatSettings
): string {
  let baseMd = pageData.markdown || ""

  baseMd = outsideCodeBlocks(baseMd, (text) => {
    if (!settings.includeImages) {
      text = text.replace(IMAGE_RE, "").replace(/<img[^>]*>/gi, "")
      // Linked images leave an empty link behind: [](https://...)
      text = text.replace(
        new RegExp(String.raw`(?<!!)\[\s*\]` + DESTINATION, "g"),
        ""
      )
    }
    if (!settings.includeLinks) {
      text = text.replace(LINK_RE, "$1").replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    }
    return text
  })

  let finalMd = ""
  const meta: string[] = []

  if (settings.includePageInfo) {
    if (pageData.title) meta.push(`**Title:** ${pageData.title}`)
    if (pageData.author) meta.push(`**Author:** ${pageData.author}`)
    if (pageData.date) meta.push(`**Date:** ${formatDate(pageData.date)}`)
  }
  if (settings.includeSourceUrl && pageData.url) {
    meta.push(`**Source:** [${pageData.url}](${pageData.url})`)
  }

  if (meta.length > 0) {
    finalMd += meta.join("\n\n") + "\n\n---\n\n"
  }

  if (settings.includeMap) {
    const pageMap = generatePageMap(
      baseMd,
      pageData.title || "Page structure map"
    )
    if (pageMap) {
      finalMd += pageMap + "\n---\n\n"
    }
  }

  finalMd += baseMd

  finalMd = outsideCodeBlocks(finalMd, (text) =>
    text
      // Remove lines that contain only a solitary dash or middle dot
      .replace(/^[ \t]*[-·][ \t]*$/gm, "")
      .replace(/^[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
  )

  return finalMd.trim()
}

/** Wraps Markdown in a fence that can't be closed early by its own content. */
export function asPrompt(markdown: string): string {
  const longestRun = Math.max(
    2,
    ...(markdown.match(/`{3,}/g) || []).map((run) => run.length)
  )
  const fence = "`".repeat(longestRun + 1)
  return `${fence}markdown\n${markdown}\n${fence}`
}

export function markdownFilename(title: string): string {
  const base = (title || "page")
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120)
  return `${base || "page"}.md`
}

/** Rough GPT-style token estimate (≈4 characters per token). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
