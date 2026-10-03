import type { PageData } from "~lib/format"

// Every conversion gets its own storage entry and its own preview URL
// (tabs/markdown.html?id=...). A shared "pageData" key used to let a preview
// tab show the result of a previous conversion (see issue #16).
const PREFIX = "preview:"
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const MAX_ENTRIES = 20

interface PreviewBase {
  createdAt: number
  sourceTabId?: number
  sourceUrl?: string
  sourceTitle?: string
}

export type PreviewEntry = PreviewBase &
  (
    | { status: "loading" }
    | { status: "ready"; pageData: PageData }
    | { status: "error"; error: string }
  )

export const previewKey = (id: string) => PREFIX + id

export async function getPreview(id: string): Promise<PreviewEntry | null> {
  const key = previewKey(id)
  const result = await chrome.storage.local.get(key)
  return (result?.[key] as PreviewEntry) || null
}

export async function setPreview(id: string, entry: PreviewEntry) {
  await chrome.storage.local.set({ [previewKey(id)]: entry })
}

/** Drops old previews so storage doesn't grow forever. */
export async function prunePreviews() {
  const all = await chrome.storage.local.get()
  const entries = Object.entries(all || {})
    .filter(([key]) => key.startsWith(PREFIX))
    .map(([key, value]) => [key, value as PreviewEntry] as const)
    .sort((a, b) => (b[1]?.createdAt || 0) - (a[1]?.createdAt || 0))

  const now = Date.now()
  const stale = entries
    .filter(
      ([, entry], index) =>
        index >= MAX_ENTRIES || now - (entry?.createdAt || 0) > MAX_AGE_MS
    )
    .map(([key]) => key)

  // "pageData" is the single shared key used by v1.0.x.
  await chrome.storage.local.remove([...stale, "pageData"])
}
