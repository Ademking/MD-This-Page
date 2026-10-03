// Injected on demand (chrome.scripting.executeScript) into the tab the user
// asked to convert — never registered as an always-on content script.
import { extractPageData } from "~lib/extract-page-data"

declare global {
  // eslint-disable-next-line no-var
  var __mdThisPage: { extract: typeof extractPageData } | undefined
}

globalThis.__mdThisPage = { extract: extractPageData }
