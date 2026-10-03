import { DEFAULT_FORMAT_SETTINGS, type FormatSettings } from "~lib/format"

export type QuickAction = "download" | "copy" | "copyPrompt"
export type Theme = "system" | "light" | "dark"

export interface Settings {
  oneClickEnabled: boolean
  oneClickAction: QuickAction
  autoCopyPreview: boolean
  theme: Theme
  format: FormatSettings
}

export const DEFAULT_SETTINGS: Settings = {
  oneClickEnabled: false,
  oneClickAction: "copy",
  autoCopyPreview: true,
  theme: "system",
  format: DEFAULT_FORMAT_SETTINGS
}

const STORAGE_KEY = "settings"

export function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const stored = result?.[STORAGE_KEY] || {}
      resolve({
        ...DEFAULT_SETTINGS,
        ...stored,
        format: { ...DEFAULT_FORMAT_SETTINGS, ...stored.format }
      })
    })
  })
}

export function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => resolve())
  })
}
