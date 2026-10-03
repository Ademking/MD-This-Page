# Changelog

## 2.0.0

### New look

- Redesigned preview tab and Options page built with [Shark UI](https://shark-ui.com/) (Ark UI + Tailwind CSS v4).
- Light, dark and system themes.
- Split / Markdown / Preview layouts, token · word · character counts, toasts and tooltips.
- Keyboard shortcuts in the preview: `Ctrl/⌘+S` downloads, `Ctrl/⌘+Shift+C` copies.
- **Re-extract** button for pages that load more content after you open the preview.
- Options save automatically, show your current shortcut and let you turn off auto-copy.

### Better extraction

- Upgraded to Defuddle 0.19 and its Markdown output: equations (MathML, MathJax, KaTeX, Wikipedia) become LaTeX and render in the preview (#4).
- Single-page apps (Angular, React, Vue…) are read after they render, with a whole-page fallback when the article extraction is too small (#14).
- Documents wrapped in rich-text editors (e.g. Baidu's docs) no longer come out as one big code block (#8).
- Every conversion gets its own preview, so a preview can never show a previous page's content (#16).
- Links and images with parentheses in their URLs are handled correctly; the page map ignores `#` lines inside code blocks; "Copy as Prompt" picks a fence that can't be closed early by the content.

### Privacy & compatibility

- No more content script on every website: the extractor is injected only into the tab you invoke the extension on (`activeTab` + `scripting`) (#6).
- Works in tabs that were open before installing/updating the extension (#9, #10).
- Clear error message on pages browsers don't let extensions read.
- Arc: falls back to a popup window when new tabs are blocked (#13).
- Safari build target and instructions (#2).

## 1.0.0

- Initial release.
