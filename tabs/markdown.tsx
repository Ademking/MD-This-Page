import {
  CheckIcon,
  ClipboardPasteIcon,
  CopyIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileUserIcon,
  ImageIcon,
  Link2Icon,
  LinkIcon,
  MapIcon,
  MoonIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SettingsIcon,
  SparklesIcon,
  SunIcon,
  TriangleAlertIcon,
  type LucideIcon
} from "lucide-react"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import "katex/dist/katex.min.css"
import "~styles/globals.css"

import { Brand } from "~components/brand"
import { Alert, AlertDescription, AlertTitle } from "~components/ui/alert"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import {
  SegmentGroup,
  SegmentGroupItem,
  SegmentGroupItemText
} from "~components/ui/segment-group"
import { Separator } from "~components/ui/separator"
import { Spinner } from "~components/ui/spinner"
import { toast, Toaster } from "~components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "~components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "~components/ui/tooltip"
import {
  asPrompt,
  DEFAULT_FORMAT_SETTINGS,
  estimateTokens,
  formatMarkdown,
  markdownFilename,
  type FormatSettings
} from "~lib/format"
import { previewKey, type PreviewEntry } from "~lib/preview-store"
import { renderMarkdown } from "~lib/render-markdown"
import { getSettings } from "~lib/settings"
import { isDarkTheme, useTheme } from "~lib/theme"
import { cn } from "~lib/utils"

type View = "split" | "markdown" | "preview"

const FORMAT_TOGGLES: {
  key: keyof FormatSettings
  label: string
  hint: string
  icon: LucideIcon
}[] = [
  {
    key: "includeImages",
    label: "Images",
    hint: "Keep images",
    icon: ImageIcon
  },
  {
    key: "includeLinks",
    label: "Links",
    hint: "Keep hyperlinks",
    icon: Link2Icon
  },
  {
    key: "includePageInfo",
    label: "Page info",
    hint: "Title, author and date",
    icon: FileUserIcon
  },
  {
    key: "includeMap",
    label: "Map",
    hint: "Outline of the page headings",
    icon: MapIcon
  },
  {
    key: "includeSourceUrl",
    label: "Source",
    hint: "Link back to the page",
    icon: LinkIcon
  }
]

const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
const MOD_KEY = isMac ? "⌘" : "Ctrl"

function useMarkdownPreviewEntry(id: string | null) {
  const [entry, setEntry] = useState<PreviewEntry | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!id) {
      setMissing(true)
      return
    }
    const key = previewKey(id)
    chrome.storage.local.get(key).then((result) => {
      if (result?.[key]) setEntry(result[key])
      else setMissing(true)
    })

    const onChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => {
      if (area === "local" && changes[key]?.newValue) {
        setEntry(changes[key].newValue)
        setMissing(false)
      }
    }
    chrome.storage.onChanged.addListener(onChange)
    return () => chrome.storage.onChanged.removeListener(onChange)
  }, [id])

  return { entry, missing }
}

function IconTooltip({
  label,
  shortcut,
  children
}: {
  label: string
  shortcut?: string
  children: React.ReactNode
}) {
  return (
    <Tooltip positioning={{ placement: "bottom" }}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <span className="flex items-center gap-2">
          {label}
          {shortcut && (
            <kbd className="rounded-sm bg-background/20 px-1 font-sans">
              {shortcut}
            </kbd>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-medium text-foreground tabular-nums">
        {value.toLocaleString()}
      </span>{" "}
      {label}
    </span>
  )
}

function Pane({
  title,
  actions,
  className,
  children
}: {
  title: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border bg-card shadow-xs/5",
        className
      )}>
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b bg-muted/40 px-3">
        <h2 className="flex items-center gap-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex items-center gap-1">{actions}</div>
      </div>
      {children}
    </section>
  )
}

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        {children}
      </div>
    </div>
  )
}

export default function MarkdownPage() {
  const previewId = useMemo(
    () => new URLSearchParams(location.search).get("id"),
    []
  )
  const { entry, missing } = useMarkdownPreviewEntry(previewId)
  const [theme, setTheme] = useTheme()

  const [format, setFormat] = useState<FormatSettings>(DEFAULT_FORMAT_SETTINGS)
  const [autoCopy, setAutoCopy] = useState<boolean | null>(null)
  const [markdown, setMarkdown] = useState("")
  const [edited, setEdited] = useState(false)
  const [view, setView] = useState<View>("split")
  const [copied, setCopied] = useState<"markdown" | "prompt" | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const autoCopiedFor = useRef<number | null>(null)

  const pageData = entry?.status === "ready" ? entry.pageData : null

  // Seed the toggles from the Options page so the tab matches whatever the
  // user configured for the quick actions.
  useEffect(() => {
    getSettings().then((settings) => {
      setFormat(settings.format)
      setAutoCopy(settings.autoCopyPreview)
    })
  }, [])

  const generated = useMemo(
    () => (pageData ? formatMarkdown(pageData, format) : ""),
    [pageData, format]
  )

  useEffect(() => {
    setMarkdown(generated)
    setEdited(false)
  }, [generated])

  useEffect(() => {
    const title = pageData?.title || entry?.sourceTitle
    document.title = title ? `${title} · .MD this page` : ".MD this page"
  }, [pageData, entry])

  const copyText = useCallback(
    async (text: string, kind: "markdown" | "prompt", quiet = false) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(kind)
        setTimeout(() => setCopied(null), 1500)
        if (!quiet) {
          toast.success({
            title: kind === "prompt" ? "Copied as prompt" : "Markdown copied",
            duration: 2000
          })
        }
        return true
      } catch (error) {
        if (!quiet) {
          toast.error({
            title: "Couldn't copy",
            description: String((error as Error)?.message || error)
          })
        }
        return false
      }
    },
    []
  )

  // Auto-copy once per extraction (if enabled in Options).
  useEffect(() => {
    if (!autoCopy || !generated || !entry) return
    if (autoCopiedFor.current === entry.createdAt) return
    autoCopiedFor.current = entry.createdAt
    copyText(generated, "markdown", true).then((ok) => {
      if (ok) {
        toast.success({
          title: "Markdown copied to your clipboard",
          description: "Auto-copy is on — you can turn it off in Options.",
          duration: 3000
        })
      }
    })
  }, [autoCopy, generated, entry, copyText])

  const handleDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = markdownFilename(pageData?.title || "")
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    toast.success({ title: `Saved ${a.download}`, duration: 2000 })
  }, [markdown, pageData])

  const handleRefresh = useCallback(async () => {
    if (!previewId) return
    setRefreshing(true)
    const response = await chrome.runtime
      .sendMessage({ action: "refresh-preview", id: previewId })
      .catch((error) => ({ success: false, error: String(error) }))
    setRefreshing(false)
    if (response?.success) {
      autoCopiedFor.current = null
      toast.success({ title: "Page re-extracted", duration: 2000 })
    } else {
      toast.error({
        title: "Couldn't re-read the page",
        description:
          "Go back to the page and run .MD this page again. Browsers only grant access right after you click the extension."
      })
    }
  }, [previewId])

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setMarkdown((current) => (current ? `${text}\n\n${current}` : text))
      setEdited(true)
    } catch {
      toast.error({
        title: "Clipboard access was blocked",
        description: `Paste with ${MOD_KEY}+V inside the editor instead.`
      })
    }
  }, [])

  // Ctrl/⌘+S downloads, Ctrl/⌘+Shift+C copies.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = isMac ? event.metaKey : event.ctrlKey
      if (!mod || !markdown) return
      if (event.key.toLowerCase() === "s") {
        event.preventDefault()
        handleDownload()
      } else if (event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault()
        void copyText(markdown, "markdown")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [markdown, handleDownload, copyText])

  const deferredMarkdown = useDeferredValue(markdown)
  const previewHtml = useMemo(
    () => renderMarkdown(deferredMarkdown),
    [deferredMarkdown]
  )

  const tokens = estimateTokens(markdown)
  const words = useMemo(
    () => (markdown.match(/[\p{L}\p{N}]+/gu) || []).length,
    [markdown]
  )

  const isDark = isDarkTheme(theme)
  const ready = entry?.status === "ready"

  const sourceUrl = pageData?.url || entry?.sourceUrl
  const sourceTitle = pageData?.title || entry?.sourceTitle || "Untitled page"
  const sourceDomain =
    pageData?.domain ||
    (() => {
      try {
        return sourceUrl ? new URL(sourceUrl).hostname : ""
      } catch {
        return ""
      }
    })()

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background/80 px-4 py-2.5 backdrop-blur">
        <Brand className="shrink-0" />
        <Separator className="hidden h-6 md:block" orientation="vertical" />

        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {pageData?.favicon ? (
            <img
              alt=""
              className="size-4 shrink-0 rounded-sm"
              onError={(e) => (e.currentTarget.style.display = "none")}
              src={pageData.favicon}
            />
          ) : null}
          <div className="min-w-0">
            <p className="truncate font-medium text-sm" title={sourceTitle}>
              {entry ? sourceTitle : " "}
            </p>
            {sourceUrl && (
              <a
                className="flex items-center gap-1 truncate text-muted-foreground text-xs hover:text-foreground"
                href={sourceUrl}
                rel="noreferrer"
                target="_blank"
                title={sourceUrl}>
                {sourceDomain}
                <ExternalLinkIcon className="size-3 shrink-0" />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <IconTooltip label="Copy Markdown" shortcut={`${MOD_KEY}+Shift+C`}>
            <Button
              disabled={!markdown}
              onClick={() => copyText(markdown, "markdown")}>
              {copied === "markdown" ? <CheckIcon /> : <CopyIcon />}
              Copy Markdown
            </Button>
          </IconTooltip>
          <IconTooltip label="Wrap in a ```markdown fence for LLM chats">
            <Button
              disabled={!markdown}
              onClick={() => copyText(asPrompt(markdown), "prompt")}
              variant="outline">
              {copied === "prompt" ? <CheckIcon /> : <SparklesIcon />}
              <span className="hidden sm:inline">Copy as Prompt</span>
            </Button>
          </IconTooltip>
          <IconTooltip label="Download .md file" shortcut={`${MOD_KEY}+S`}>
            <Button
              aria-label="Download .md"
              disabled={!markdown}
              onClick={handleDownload}
              variant="outline">
              <DownloadIcon />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </IconTooltip>

          <Separator className="mx-1 h-6" orientation="vertical" />

          <IconTooltip label="Re-extract from the page">
            <Button
              aria-label="Re-extract from the page"
              disabled={!entry || entry.status === "loading" || refreshing}
              onClick={handleRefresh}
              size="icon-md"
              variant="ghost">
              <RefreshCwIcon className={cn(refreshing && "animate-spin")} />
            </Button>
          </IconTooltip>
          <IconTooltip label={isDark ? "Light theme" : "Dark theme"}>
            <Button
              aria-label="Toggle theme"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              size="icon-md"
              variant="ghost">
              {isDark ? <SunIcon /> : <MoonIcon />}
            </Button>
          </IconTooltip>
          <IconTooltip label="Options">
            <Button
              aria-label="Options"
              onClick={() => chrome.runtime.openOptionsPage()}
              size="icon-md"
              variant="ghost">
              <SettingsIcon />
            </Button>
          </IconTooltip>
        </div>
      </header>

      {/* Output toolbar */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <ToggleGroup
          aria-label="Content to include"
          className="flex-wrap"
          disabled={!ready}
          multiple
          onValueChange={({ value }) =>
            setFormat((current) => {
              const next = { ...current }
              FORMAT_TOGGLES.forEach(({ key }) => {
                next[key] = value.includes(key)
              })
              return next
            })
          }
          size="sm"
          value={FORMAT_TOGGLES.filter(({ key }) => format[key]).map(
            ({ key }) => key
          )}
          variant="outline">
          {FORMAT_TOGGLES.map(({ key, label, hint, icon: Icon }) => (
            <ToggleGroupItem
              className="data-[state=on]:bg-accent data-[state=on]:text-foreground data-[state=off]:text-muted-foreground"
              key={key}
              title={hint}
              value={key}>
              <Icon />
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 text-muted-foreground text-xs md:flex">
            <Stat label="tokens" value={tokens} />
            <Stat label="words" value={words} />
            <Stat label="chars" value={markdown.length} />
          </div>
          <SegmentGroup
            aria-label="Layout"
            className="rounded-lg bg-muted p-0.5 text-xs"
            onValueChange={({ value }) => value && setView(value as View)}
            value={view}>
            {(["split", "markdown", "preview"] as View[]).map((option) => (
              <SegmentGroupItem
                className="px-2.5 py-1 font-medium capitalize data-[state=unchecked]:text-muted-foreground"
                key={option}
                value={option}>
                <SegmentGroupItemText>{option}</SegmentGroupItemText>
              </SegmentGroupItem>
            ))}
          </SegmentGroup>
        </div>
      </div>

      {/* Body */}
      {missing || !previewId ? (
        <CenteredState>
          <Alert variant="warning">
            <TriangleAlertIcon />
            <AlertTitle>Nothing to show</AlertTitle>
            <AlertDescription>
              This preview has expired or was opened directly. Go back to a page
              and click the extension icon, use the right-click menu, or press
              Alt+M.
            </AlertDescription>
          </Alert>
        </CenteredState>
      ) : !entry || entry.status === "loading" ? (
        <CenteredState>
          <Spinner className="size-6 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Reading the page…</p>
            <p className="text-muted-foreground text-sm">
              Extracting the main content and converting it to Markdown.
            </p>
          </div>
        </CenteredState>
      ) : entry.status === "error" ? (
        <CenteredState>
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>Couldn't convert this page</AlertTitle>
            <AlertDescription>{entry.error}</AlertDescription>
          </Alert>
          <Button
            isLoading={refreshing}
            onClick={handleRefresh}
            variant="outline">
            <RefreshCwIcon />
            Try again
          </Button>
        </CenteredState>
      ) : (
        <main
          className={cn(
            "grid min-h-0 flex-1 gap-3 p-3",
            view === "split" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}>
          <Pane
            actions={
              <>
                {edited && (
                  <Badge className="mr-1" size="sm" variant="info">
                    Edited
                  </Badge>
                )}
                <Button onClick={handlePaste} size="xs" variant="ghost">
                  <ClipboardPasteIcon />
                  Paste
                </Button>
                <Button
                  disabled={!edited}
                  onClick={() => {
                    setMarkdown(generated)
                    setEdited(false)
                  }}
                  size="xs"
                  variant="ghost">
                  <RotateCcwIcon />
                  Reset
                </Button>
              </>
            }
            className={cn(view === "preview" && "hidden")}
            title="Markdown">
            <textarea
              aria-label="Markdown output"
              className="min-h-0 w-full flex-1 resize-none bg-transparent p-4 font-mono text-[13px] text-foreground/90 leading-relaxed outline-none placeholder:text-muted-foreground md:p-5"
              onChange={(e) => {
                setMarkdown(e.target.value)
                setEdited(true)
              }}
              placeholder="No content was found on this page. Paste or write Markdown here…"
              spellCheck={false}
              value={markdown}
            />
          </Pane>

          <Pane className={cn(view === "markdown" && "hidden")} title="Preview">
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
              <article
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                className="prose prose-sm prose-neutral dark:prose-invert max-w-none prose-headings:font-heading prose-headings:tracking-tight prose-a:underline-offset-4 prose-img:rounded-lg prose-pre:border prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none"
              />
            </div>
          </Pane>
        </main>
      )}

      <Toaster />
    </div>
  )
}
