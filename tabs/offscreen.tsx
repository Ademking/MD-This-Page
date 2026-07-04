import { useEffect } from "react"

// Hidden offscreen document. Its only job is writing to the clipboard on
// behalf of the background service worker, which has no DOM/clipboard access
// of its own. See background.ts's copyToClipboard().
export default function OffscreenPage() {
  useEffect(() => {
    const listener = (
      request: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: { success: boolean; error?: string }) => void
    ) => {
      if (
        request?.target !== "offscreen" ||
        request.action !== "copy-to-clipboard"
      ) {
        return
      }
      navigator.clipboard
        .writeText(request.text ?? "")
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: String(err) }))
      return true
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  return null
}
