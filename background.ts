import extractorUrl from "raw:~generated/page-extractor.js"

import {
  asPrompt,
  formatMarkdown,
  markdownFilename,
  type PageData
} from "~lib/format"
import { openMarkdownPage } from "~lib/open-markdown-page"
import { getPreview, prunePreviews, setPreview } from "~lib/preview-store"
import { getSettings, type QuickAction } from "~lib/settings"

export {}

// The page extractor (Defuddle + Markdown conversion) is bundled as its own
// script and injected only into the tab the user acts on, using the
// "activeTab" grant. Nothing runs on pages the user never converts (#6), and
// tabs that were open before the extension was installed or updated work
// without a reload (#9, #10).
const EXTRACTOR_FILE = new URL(
  extractorUrl,
  chrome.runtime.getURL("/")
).pathname.replace(/^\//, "")

const MENU_ITEMS: { id: string; title: string }[] = [
  { id: "convert-to-markdown", title: "Open Preview Tab" },
  { id: "copy-markdown", title: "Copy Markdown" },
  { id: "copy-as-prompt", title: "Copy as Prompt" },
  { id: "download-md", title: "Download .MD" }
]

chrome.runtime.onInstalled.addListener(() => {
  // removeAll first: onInstalled also fires on update, and re-creating an
  // existing id throws.
  chrome.contextMenus.removeAll(() => {
    MENU_ITEMS.forEach(({ id, title }) =>
      chrome.contextMenus.create({ id, title, contexts: ["page", "action"] })
    )
  })
  void prunePreviews()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return
  switch (info.menuItemId) {
    case "convert-to-markdown":
      void openPreview(tab)
      break
    case "copy-markdown":
      void runQuickAction(tab.id, "copy")
      break
    case "copy-as-prompt":
      void runQuickAction(tab.id, "copyPrompt")
      break
    case "download-md":
      void runQuickAction(tab.id, "download")
      break
  }
})

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command !== "convert-to-markdown") return
  // Some browsers don't pass the tab to command listeners.
  const target =
    tab?.id !== undefined
      ? tab
      : (await chrome.tabs.query({ active: true, currentWindow: true }))[0]
  if (target?.id !== undefined) void openPreview(target)
})

// Left-click on the toolbar icon: either run the configured quick action, or
// fall back to the full preview tab if the user hasn't enabled one-click mode.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return
  const settings = await getSettings()
  if (settings.oneClickEnabled) {
    void runQuickAction(tab.id, settings.oneClickAction)
  } else {
    void openPreview(tab)
  }
})

// The preview tab asks for a fresh extraction ("Re-extract" button), e.g.
// after a single-page app finished loading more content.
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request?.action === "refresh-preview" && request.id) {
    refreshPreview(request.id).then(
      () => sendResponse({ success: true }),
      (error) => sendResponse({ success: false, error: describeError(error) })
    )
    return true
  }
  if (request?.action === "open-options") {
    chrome.runtime.openOptionsPage()
  }
})

async function openPreview(tab: chrome.tabs.Tab) {
  const id = crypto.randomUUID()
  const base = {
    createdAt: Date.now(),
    sourceTabId: tab.id,
    sourceUrl: tab.url,
    sourceTitle: tab.title
  }
  await setPreview(id, { ...base, status: "loading" })
  void prunePreviews().catch(() => {})

  // Start extracting while the source tab is still in the foreground, then
  // open the preview, which shows a loader until the entry is ready.
  const extraction = extractFromTab(tab.id!)
  try {
    await openMarkdownPage(id, tab)
  } catch (error) {
    console.error("Failed to open Markdown preview:", error)
  }

  try {
    const pageData = await extraction
    await setPreview(id, { ...base, status: "ready", pageData })
  } catch (error) {
    console.error("Markdown conversion failed:", error)
    await setPreview(id, {
      ...base,
      status: "error",
      error: describeError(error, tab.url)
    })
  }
}

async function refreshPreview(id: string) {
  const entry = await getPreview(id)
  if (!entry?.sourceTabId) throw new Error("The original tab is unknown.")
  const { createdAt, sourceTabId, sourceUrl, sourceTitle } = entry
  const base = { createdAt, sourceTabId, sourceUrl, sourceTitle }

  await setPreview(id, { ...base, status: "loading" })
  try {
    const pageData = await extractFromTab(sourceTabId)
    await setPreview(id, { ...base, status: "ready", pageData })
  } catch (error) {
    // Keep showing the previous result if there was one; the preview tab
    // reports the failure in a toast.
    await setPreview(
      id,
      entry.status === "ready"
        ? entry
        : { ...base, status: "error", error: describeError(error, sourceUrl) }
    )
    throw error
  }
}

async function extractFromTab(tabId: number): Promise<PageData> {
  const target = { tabId }
  const [probe] = await chrome.scripting.executeScript({
    target,
    func: () => typeof globalThis.__mdThisPage !== "undefined"
  })
  if (!probe?.result) {
    await chrome.scripting.executeScript({ target, files: [EXTRACTOR_FILE] })
  }

  const [injection] = await chrome.scripting.executeScript({
    target,
    func: () => globalThis.__mdThisPage!.extract(document, location.href)
  })
  const pageData = injection?.result as PageData | undefined
  if (!pageData) throw new Error("The page returned no content.")
  return pageData
}

async function runQuickAction(tabId: number, action: QuickAction) {
  try {
    const settings = await getSettings()
    const pageData = await extractFromTab(tabId)
    const markdown = formatMarkdown(pageData, settings.format)

    if (action === "download") {
      await downloadMarkdown(tabId, markdown, markdownFilename(pageData.title))
    } else {
      await copyToClipboard(
        tabId,
        action === "copyPrompt" ? asPrompt(markdown) : markdown
      )
    }
    showBadge(tabId, "✓", "#10b981", "Done!")
  } catch (err) {
    console.error("Quick action failed:", err)
    showBadge(tabId, "!", "#ef4444", describeError(err))
  }
}

async function downloadMarkdown(
  tabId: number,
  markdown: string,
  filename: string
) {
  // Triggered from the page rather than chrome.downloads.download() with a
  // data: URL: Firefox rejects data: URLs requested by a background script
  // with "Access denied", even though Chrome allows it. A plain Blob +
  // <a download> in the page works identically in both browsers and needs no
  // "downloads" permission.
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    args: [markdown, filename],
    func: (text: string, name: string) => {
      try {
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = name
        a.style.display = "none"
        document.documentElement.appendChild(a)
        a.click()
        a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  })
  const response = injection?.result as
    | { success: boolean; error?: string }
    | undefined
  if (!response?.success) {
    throw new Error(response?.error || "Download failed")
  }
}

async function copyToClipboard(tabId: number, text: string) {
  // Written from the page itself, not a background offscreen document: an
  // offscreen document never has focus, and Chrome's Clipboard API refuses
  // to write from an unfocused document (verified in Brave). The
  // "clipboardWrite" permission lets the execCommand fallback succeed when
  // the async API is rejected for lacking focus or user activation.
  const [injection] = await chrome.scripting.executeScript({
    target: { tabId },
    args: [text],
    func: async (value: string) => {
      try {
        await navigator.clipboard.writeText(value)
        return { success: true }
      } catch (err) {
        const active = document.activeElement as HTMLElement | null
        const textarea = document.createElement("textarea")
        textarea.value = value
        textarea.setAttribute("readonly", "")
        textarea.style.cssText = "position:fixed;top:-9999px;opacity:0"
        document.documentElement.appendChild(textarea)
        textarea.select()
        const ok = document.execCommand("copy")
        textarea.remove()
        active?.focus?.()
        return ok
          ? { success: true }
          : {
              success: false,
              error: `${(err as Error).name}: ${(err as Error).message}`
            }
      }
    }
  })
  const response = injection?.result as
    | { success: boolean; error?: string }
    | undefined
  if (!response?.success) {
    throw new Error(response?.error || "Clipboard write failed")
  }
}

function describeError(error: unknown, url?: string): string {
  const message = error instanceof Error ? error.message : String(error)
  if (url?.startsWith("file:")) {
    return "To convert local files, enable “Allow access to file URLs” for this extension on the browser's extensions page."
  }
  if (
    /cannot be scripted|cannot access|missing host permission|extensions gallery|chrome:\/\/|edge:\/\/|about:/i.test(
      message
    )
  ) {
    return "Your browser doesn't let extensions read this page (built-in pages, the extension store, the PDF viewer…). Try it on a regular web page."
  }
  return message || "Something went wrong while converting this page."
}

function showBadge(tabId: number, text: string, color: string, title: string) {
  chrome.action.setBadgeText({ tabId, text })
  chrome.action.setBadgeBackgroundColor({ tabId, color })
  chrome.action.setTitle({ tabId, title: `.MD this page — ${title}` })
  setTimeout(() => {
    chrome.action.setBadgeText({ tabId, text: "" })
    chrome.action.setTitle({ tabId, title: chrome.runtime.getManifest().name })
  }, 2000)
}
