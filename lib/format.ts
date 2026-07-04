export interface PageData {
  markdown: string
  title: string
  author: string
  date: string
  url: string
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

interface HeadingNode {
  text: string
  level: number
  children: HeadingNode[]
}

export function generatePageMap(
  markdown: string,
  title: string = "Document Structure"
): string {
  const lines = markdown.split("\n")
  const headings: { level: number; text: string }[] = []

  lines.forEach((line) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (match) {
      headings.push({ level: match[1].length, text: match[2].trim() })
    }
  })

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

  function renderNode(
    node: HeadingNode,
    prefix: string,
    isLast: boolean,
    isRoot: boolean
  ) {
    if (!isRoot) {
      const connector = isLast ? "└── " : "├── "
      mapStr += `${prefix}${connector}${node.text}\n`

      if (node.children.length > 0) {
        const childPrefix = prefix + (isLast ? "    " : "│   ")
        node.children.forEach((child, index) => {
          renderNode(
            child,
            childPrefix,
            index === node.children.length - 1,
            false
          )
        })
      }
    } else {
      node.children.forEach((child, index) => {
        renderNode(child, "", index === node.children.length - 1, false)
      })
    }
  }

  renderNode(root, "", true, true)

  mapStr = mapStr.replace(/│\n$/g, "").trimEnd()

  return "# Page Structure Map\n```text\n" + mapStr + "\n```\n"
}

export function formatMarkdown(
  pageData: PageData,
  settings: FormatSettings
): string {
  let baseMd = pageData.markdown || ""

  if (!settings.includeImages) {
    baseMd = baseMd.replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    baseMd = baseMd.replace(/<img[^>]*>/gi, "")
  }

  if (!settings.includeLinks) {
    baseMd = baseMd.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    baseMd = baseMd.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
  }

  let finalMd = ""
  const meta: string[] = []

  if (settings.includePageInfo) {
    if (pageData.title) meta.push(`**Title:** ${pageData.title}`)
    if (pageData.author) meta.push(`**Author:** ${pageData.author}`)
    if (pageData.date)
      meta.push(`**Date:** ${new Date(pageData.date).toLocaleDateString()}`)
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

  finalMd = finalMd.replace(/^[ \t]*[-·][ \t]*$/gm, "")
  finalMd = finalMd.replace(/^[ \t]+$/gm, "")
  finalMd = finalMd.replace(/\n{3,}/g, "\n\n").trim()

  return finalMd
}

export function asPrompt(markdown: string): string {
  return "```markdown\n" + markdown + "\n```"
}
