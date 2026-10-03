import { useCallback, useEffect, useState } from "react"

import { getSettings, saveSettings, type Theme } from "~lib/settings"

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)")

export function isDarkTheme(theme: Theme) {
  return theme === "dark" || (theme === "system" && darkQuery().matches)
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", isDarkTheme(theme))
}

// Apply the OS preference immediately so the page doesn't flash before the
// stored setting is read.
if (typeof window !== "undefined") applyTheme("system")

/** Reads, applies and persists the light/dark theme preference. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>("system")

  useEffect(() => {
    getSettings().then((settings) => setThemeState(settings.theme))

    const onStorage = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "sync" && changes.settings?.newValue?.theme) {
        setThemeState(changes.settings.newValue.theme)
      }
    }
    chrome.storage.onChanged.addListener(onStorage)
    return () => chrome.storage.onChanged.removeListener(onStorage)
  }, [])

  useEffect(() => {
    applyTheme(theme)
    if (theme !== "system") return
    const query = darkQuery()
    const onChange = () => applyTheme("system")
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next)
    getSettings().then((settings) => saveSettings({ ...settings, theme: next }))
  }, [])

  return [theme, setTheme]
}
