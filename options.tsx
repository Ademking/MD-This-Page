import {
  ClipboardCopyIcon,
  DownloadIcon,
  KeyboardIcon,
  LaptopIcon,
  MonitorIcon,
  MoonIcon,
  MousePointerClickIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  type LucideIcon
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import "~styles/globals.css"

import { Brand } from "~components/brand"
import { Button } from "~components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "~components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel
} from "~components/ui/field"
import { Kbd, KbdGroup } from "~components/ui/kbd"
import { RadioGroup, RadioGroupItem } from "~components/ui/radio-group"
import {
  SegmentGroup,
  SegmentGroupItem,
  SegmentGroupItemText
} from "~components/ui/segment-group"
import { Separator } from "~components/ui/separator"
import { Switch } from "~components/ui/switch"
import { toast, Toaster } from "~components/ui/toast"
import { type FormatSettings } from "~lib/format"
import {
  DEFAULT_SETTINGS,
  getSettings,
  saveSettings,
  type QuickAction,
  type Settings,
  type Theme
} from "~lib/settings"
import { applyTheme } from "~lib/theme"
import { cn } from "~lib/utils"

const ACTION_OPTIONS: {
  value: QuickAction
  label: string
  description: string
  icon: LucideIcon
}[] = [
  {
    value: "copy",
    label: "Copy Markdown",
    description: "Put the page's Markdown on your clipboard.",
    icon: ClipboardCopyIcon
  },
  {
    value: "copyPrompt",
    label: "Copy as Prompt",
    description: "Same, wrapped in a ```markdown fence for LLM chats.",
    icon: SparklesIcon
  },
  {
    value: "download",
    label: "Download .MD",
    description: "Save the page as a Markdown file.",
    icon: DownloadIcon
  }
]

const FORMAT_OPTIONS: {
  key: keyof FormatSettings
  label: string
  description: string
}[] = [
  {
    key: "includeImages",
    label: "Images",
    description: "Keep image references (![alt](url))."
  },
  {
    key: "includeLinks",
    label: "Links",
    description: "Keep hyperlinks instead of plain text."
  },
  {
    key: "includePageInfo",
    label: "Page info",
    description: "Add the title, author and publish date at the top."
  },
  {
    key: "includeMap",
    label: "Page map",
    description: "Add a tree outline of the page's headings."
  },
  {
    key: "includeSourceUrl",
    label: "Source link",
    description: "Add a link back to the original page."
  }
]

const THEME_OPTIONS: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "system", label: "System", icon: MonitorIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon }
]

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
  disabled
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <Field disabled={disabled} orientation="horizontal">
      <FieldContent>
        <FieldLabel>{label}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch
        checked={checked}
        onCheckedChange={({ checked }) => onCheckedChange(checked)}
      />
    </Field>
  )
}

function useShortcut() {
  const [shortcut, setShortcut] = useState<string | null>(null)
  useEffect(() => {
    chrome.commands?.getAll?.((commands) => {
      const command = commands.find((c) => c.name === "convert-to-markdown")
      setShortcut(command?.shortcut || "")
    })
  }, [])
  return shortcut
}

function openShortcutSettings() {
  const commands = chrome.commands as typeof chrome.commands & {
    openShortcutSettings?: () => void
  }
  if (typeof commands.openShortcutSettings === "function") {
    // Firefox 137+
    commands.openShortcutSettings()
  } else {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" })
  }
}

export default function OptionsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loaded, setLoaded] = useState(false)
  const shortcut = useShortcut()

  useEffect(() => {
    document.title = "Options · .MD this page"
    getSettings().then((s) => {
      setSettings(s)
      applyTheme(s.theme)
      setLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (settings.theme !== "system") return
    const query = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("system")
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [settings.theme])

  // Settings save as soon as they change.
  const update = useCallback(
    (patch: (prev: Settings) => Settings) => {
      const next = patch(settings)
      setSettings(next)
      applyTheme(next.theme)
      saveSettings(next).then(() =>
        toast.success({ id: "saved", title: "Settings saved", duration: 1500 })
      )
    },
    [settings]
  )

  if (!loaded) return null

  return (
    <div className="min-h-svh bg-muted/30">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
        <header className="flex flex-col gap-3">
          <Brand />
          <div>
            <h1 className="font-heading font-semibold text-2xl tracking-tight">
              Options
            </h1>
            <p className="text-muted-foreground text-sm">
              Changes are saved automatically and sync across your signed-in
              browsers.
            </p>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MousePointerClickIcon className="size-4 text-muted-foreground" />
              Toolbar button
            </CardTitle>
            <CardDescription>
              By default, clicking the toolbar icon opens the preview tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <SettingRow
              checked={settings.oneClickEnabled}
              description="Clicking the icon runs the action below right away, without opening the preview."
              label="One-click action"
              onCheckedChange={(checked) =>
                update((prev) => ({ ...prev, oneClickEnabled: checked }))
              }
            />
            <RadioGroup
              aria-label="One-click action"
              className={cn(
                "grid gap-2 sm:grid-cols-3",
                !settings.oneClickEnabled && "opacity-50"
              )}
              disabled={!settings.oneClickEnabled}
              onValueChange={({ value }) =>
                value &&
                update((prev) => ({
                  ...prev,
                  oneClickAction: value as QuickAction
                }))
              }
              value={settings.oneClickAction}>
              {ACTION_OPTIONS.map(
                ({ value, label, description, icon: Icon }) => (
                  <RadioGroupItem
                    className={cn(
                      "relative flex h-full flex-col items-start gap-2 rounded-xl border p-3 transition-colors",
                      "has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10",
                      "[&>[data-slot=radio-group-item-control]]:absolute [&>[data-slot=radio-group-item-control]]:top-3 [&>[data-slot=radio-group-item-control]]:right-3"
                    )}
                    key={value}
                    value={value}>
                    <span className="flex flex-col gap-1.5">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{label}</span>
                      <span className="font-normal text-muted-foreground text-xs leading-snug">
                        {description}
                      </span>
                    </span>
                  </RadioGroupItem>
                )
              )}
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
            <CardDescription>
              Defaults for the quick actions (toolbar, right-click “Copy
              Markdown”, “Copy as Prompt”, “Download .MD”) and the starting
              toggles of the preview tab.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {FORMAT_OPTIONS.map((opt, index) => (
              <div className="flex flex-col gap-4" key={opt.key}>
                {index > 0 && <Separator />}
                <SettingRow
                  checked={settings.format[opt.key]}
                  description={opt.description}
                  label={opt.label}
                  onCheckedChange={(checked) =>
                    update((prev) => ({
                      ...prev,
                      format: { ...prev.format, [opt.key]: checked }
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LaptopIcon className="size-4 text-muted-foreground" />
              Preview tab
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SettingRow
              checked={settings.autoCopyPreview}
              description="Copy the Markdown to your clipboard as soon as the preview opens."
              label="Auto-copy"
              onCheckedChange={(checked) =>
                update((prev) => ({ ...prev, autoCopyPreview: checked }))
              }
            />
            <Separator />
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel>Theme</FieldLabel>
                <FieldDescription>
                  Used by the preview and this page.
                </FieldDescription>
              </FieldContent>
              <SegmentGroup
                aria-label="Theme"
                className="w-auto shrink-0 rounded-lg bg-muted p-0.5 text-xs"
                onValueChange={({ value }) =>
                  value &&
                  update((prev) => ({ ...prev, theme: value as Theme }))
                }
                value={settings.theme}>
                {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <SegmentGroupItem
                    className="px-2.5 py-1 font-medium data-[state=unchecked]:text-muted-foreground"
                    key={value}
                    value={value}>
                    <SegmentGroupItemText className="flex items-center gap-1.5">
                      <Icon className="size-3.5" />
                      {label}
                    </SegmentGroupItemText>
                  </SegmentGroupItem>
                ))}
              </SegmentGroup>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyboardIcon className="size-4 text-muted-foreground" />
              Keyboard shortcut
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Open preview:</span>
              {shortcut ? (
                <KbdGroup>
                  {shortcut
                    .split(/\+|(?<=[⌘⌥⇧⌃])/)
                    .filter(Boolean)
                    .map((key) => (
                      <Kbd key={key} variant="outline">
                        {key}
                      </Kbd>
                    ))}
                </KbdGroup>
              ) : (
                <span className="text-muted-foreground">Not set</span>
              )}
            </div>
            <Button onClick={openShortcutSettings} size="sm" variant="outline">
              Change shortcut
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-dashed p-4 text-muted-foreground text-sm">
          <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
          <p>
            .MD this page only reads a page when you ask it to, and everything
            happens locally in your browser. No page content ever leaves your
            device.
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
