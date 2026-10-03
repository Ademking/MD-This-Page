import DOMPurify from "dompurify"
import { Marked } from "marked"
import markedKatex from "marked-katex-extension"

const marked = new Marked({ gfm: true, breaks: false }).use(
  markedKatex({ throwOnError: false, nonStandard: true, output: "html" })
)

// Links in the preview open in a new tab and never leak the extension URL.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank")
    node.setAttribute("rel", "noopener noreferrer")
  }
})

/** Markdown (with $math$) → sanitized HTML for the live preview. */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, mathMl: true }
  })
}
