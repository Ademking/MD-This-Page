import Markdown from "markdown-to-jsx"
import { useEffect, useRef, useState } from "react"
import TurndownService from "turndown"

import "./style.css"

const CheckIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-check-icon lucide-check"
        {...props}>
        <path d="M20 6 9 17l-5-5" />
    </svg>
)

const SourceUrlIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-link-icon lucide-link"
        {...props}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
)

const MetaDataIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-file-user-icon lucide-file-user"
        {...props}>
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
        <path d="M16 22a4 4 0 0 0-8 0" />
        <circle cx={12} cy={15} r={3} />
    </svg>
)

const LinkIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-link2-icon lucide-link-2"
        {...props}>
        <path d="M9 17H7A5 5 0 0 1 7 7h2" />
        <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
        <line x1={8} x2={16} y1={12} y2={12} />
    </svg>
)

const ImageIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-image-icon lucide-image"
        {...props}>
        <rect width={18} height={18} x={3} y={3} rx={2} ry={2} />
        <circle cx={9} cy={9} r={2} />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
)

const CopyIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-copy-icon lucide-copy"
        {...props}>
        <rect width={14} height={14} x={8} y={8} rx={2} ry={2} />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
)

const DownloadIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-download-icon lucide-download"
        {...props}>
        <path d="M12 15V3" />
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="m7 10 5 5 5-5" />
    </svg>
)

const PasteIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    </svg>
)

const TrashIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
)

const MapIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="lucide lucide-map-icon lucide-map"
        {...props}
    >
        <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
        <path d="M15 5.764v15" />
        <path d="M9 3.236v15" />
    </svg>
)

interface HeadingNode {
    text: string
    level: number
    children: HeadingNode[]
}

function generatePageMap(
    markdown: string,
    title: string = "Document Structure"
): string {
    const lines = markdown.split("\n")
    const headings: { level: number; text: string }[] = []

    // Extract headings
    lines.forEach((line) => {
        const match = line.match(/^(#{1,6})\s+(.+)$/)
        if (match) {
            headings.push({ level: match[1].length, text: match[2].trim() })
        }
    })

    if (headings.length === 0) return ""

    // Build tree
    const root: HeadingNode = { text: title, level: 0, children: [] }
    const stack: HeadingNode[] = [root]

    headings.forEach((h) => {
        const node: HeadingNode = { text: h.text, level: h.level, children: [] }
        while (stack.length > 1 && stack[stack.length - 1].level >= h.level) {
            stack.pop()
        }
        stack[stack.length - 1].children.push(node)
        stack.push(node)
    })

    // Render tree
    let mapStr = `${title}\n`

    function renderNode(
        node: HeadingNode,
        prefix: string,
        isLast: boolean,
        isRoot: boolean
    ) {
        if (!isRoot) {
            const connector = isLast ? "└── " : "├── "
            mapStr += `${prefix}${connector}${node.text}\n`

            // For children
            if (node.children.length > 0) {
                const childPrefix = prefix + (isLast ? "    " : "│   ")
                node.children.forEach((child, index) => {
                    renderNode(
                        child,
                        childPrefix,
                        index === node.children.length - 1,
                        false
                    )
                })
            }
        } else {
            node.children.forEach((child, index) => {
                renderNode(child, "", index === node.children.length - 1, false)
            })
        }
    }

    renderNode(root, "", true, true)

    // Clean up empty vertical lines at the end if any
    mapStr = mapStr.replace(/│\n$/g, "").trimEnd()

    return "# Page Structure Map\n```text\n" + mapStr + "\n```\n"
}

export default function MarkdownPage() {
    const [markdown, setMarkdown] = useState("")
    const [status, setStatus] = useState("")
    const [error, setError] = useState("")
    const [pageData, setPageData] = useState<any>(null)
    const [hasAutoCopied, setHasAutoCopied] = useState(false)
    const [copiedIcon, setCopiedIcon] = useState<
        "markdown" | "prompt" | "download" | null
    >(null)
    const [toggles, setToggles] = useState({
        removeImages: true,
        removeLinks: true,
        showMetadata: true,
        showSourceUrl: true,
        showPageMap: true
    })

    useEffect(() => {
        chrome.storage.local.get(["pageData"], (result) => {
            if (chrome.runtime.lastError) {
                setError(chrome.runtime.lastError.message || "Failed to load")
            } else if (result.pageData) {
                setPageData(result.pageData)
            } else {
                setError("No page data found. Please trigger the extension again.")
            }
        })
    }, [])

    useEffect(() => {
        if (!pageData || !pageData.markdown) return

        let baseMd = pageData.markdown

        if (toggles.removeImages) {
            // Remove markdown images: ![alt](url)
            baseMd = baseMd.replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
            // Remove lingering HTML image tags that Turndown may have skipped
            baseMd = baseMd.replace(/<img[^>]*>/gi, "")
        }

        if (toggles.removeLinks) {
            // Remove markdown links but keep text: [text](url)
            baseMd = baseMd.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            // Remove lingering HTML anchor tags but keep text
            baseMd = baseMd.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
        }

        let finalMd = ""
        let meta = []

        if (toggles.showMetadata) {
            if (pageData.title) meta.push(`**Title:** ${pageData.title}`)
            if (pageData.author) meta.push(`**Author:** ${pageData.author}`)
            if (pageData.date)
                meta.push(`**Date:** ${new Date(pageData.date).toLocaleDateString()}`)
        }
        if (toggles.showSourceUrl && pageData.url) {
            meta.push(`**Source:** [${pageData.url}](${pageData.url})`)
        }

        if (meta.length > 0) {
            finalMd += meta.join("\n\n") + "\n\n---\n\n"
        }

        if (toggles.showPageMap) {
            const pageMap = generatePageMap(
                baseMd,
                pageData.title || "Page structure map"
            )
            if (pageMap) {
                finalMd += pageMap + "\n---\n\n"
            }
        }

        finalMd += baseMd

        // Remove lines that contain only a solitary dash or middle dot (possibly with spaces)
        finalMd = finalMd.replace(/^[ \t]*[-·][ \t]*$/gm, "")

        // Clean up any spaces on blank lines, then collapse 3+ newlines into 2
        finalMd = finalMd.replace(/^[ \t]+$/gm, "")
        finalMd = finalMd.replace(/\n{3,}/g, "\n\n").trim()

        setMarkdown(finalMd)
    }, [pageData, toggles])

    useEffect(() => {
        if (markdown && !hasAutoCopied) {
            setHasAutoCopied(true)
            navigator.clipboard
                .writeText(markdown)
                .then(() => {
                    setStatus("Auto-copied!")
                    setTimeout(() => setStatus(""), 2000)
                })
                .catch((err) => {
                    console.error("Auto-copy failed:", err)
                })
        }
    }, [markdown, hasAutoCopied])

    const handleCopy = () => {
        navigator.clipboard.writeText(markdown).then(() => {
            setStatus("Copied!")
            setCopiedIcon("markdown")
            setTimeout(() => {
                setStatus("")
                setCopiedIcon(null)
            }, 1500)
        })
    }

    const handleCopyPrompt = () => {
        const promptText = `\`\`\`markdown\n${markdown}\n\`\`\``
        navigator.clipboard.writeText(promptText).then(() => {
            setStatus("Copied as Prompt!")
            setCopiedIcon("prompt")
            setTimeout(() => {
                setStatus("")
                setCopiedIcon(null)
            }, 1500)
        })
    }

    const handleToggle = (key: keyof typeof toggles) => {
        setToggles((p) => ({ ...p, [key]: !p[key] }))
    }

    const handleDownload = () => {
        const blob = new Blob([markdown], { type: "text/markdown" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${pageData?.title ? pageData.title.replace(/\s+/g, "_") : "page"}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setStatus("Downloaded!")
        setCopiedIcon("download")
        setTimeout(() => {
            setStatus("")
            setCopiedIcon(null)
        }, 1500)
    }

    const tokenEstimate = Math.ceil(markdown.length / 4)

    return (
        <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <header className="relative px-4 py-4 border-b border-zinc-800/60 bg-zinc-900/60 backdrop-blur-md flex flex-wrap gap-3 items-center justify-between z-10 shrink-0 shadow-sm">
                <div className="flex items-center gap-2 relative z-10">
                    <button
                        onClick={handleCopy}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-[0_2px_10px_-3px_rgba(16,185,129,0.3)] transition-all duration-200 active:scale-[0.98] outline-none focus:ring-2 focus:ring-emerald-500/40">
                        {copiedIcon === "markdown" ? (
                            <CheckIcon className="w-4 h-4" />
                        ) : (
                            <CopyIcon className="w-4 h-4 opacity-90 group-hover:opacity-100" />
                        )}
                        Copy Markdown
                    </button>
                    <button
                        onClick={handleCopyPrompt}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all duration-200 active:scale-[0.98] outline-none">
                        {copiedIcon === "prompt" ? (
                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <CopyIcon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                        )}
                        Copy as Prompt
                    </button>
                    <button
                        onClick={handleDownload}
                        className="group inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-all duration-200 active:scale-[0.98] outline-none">
                        {copiedIcon === "download" ? (
                            <CheckIcon className="w-4 h-4 text-emerald-400" />
                        ) : (
                            <DownloadIcon className="w-4 h-4 opacity-90 group-hover:opacity-100" />
                        )}
                        Download .MD
                    </button>
                </div>

                {pageData && (
                    <div className="hidden lg:flex flex-col items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        {/* segmented control */}
                        <div className="flex items-center p-1 bg-zinc-950/60 border border-zinc-800/40 backdrop-blur-xl shadow-lg rounded-full">
                            {/* Images */}
                            <button
                                onClick={() => handleToggle("removeImages")}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all
          rounded-l-xl
          ${!toggles.removeImages
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                                    }`}>
                                <ImageIcon className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                                Images
                            </button>

                            {/* Links */}
                            <button
                                onClick={() => handleToggle("removeLinks")}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all
          border-l border-zinc-800/40
          ${!toggles.removeLinks
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                                    }`}>
                                <LinkIcon className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                                Links
                            </button>

                            {/* Metadata */}
                            <button
                                onClick={() => handleToggle("showMetadata")}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all
          border-l border-zinc-800/40
          ${toggles.showMetadata
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                                    }`}>
                                <MetaDataIcon className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                                Page Info
                            </button>

                            {/* Page Map */}
                            <button
                                onClick={() => handleToggle("showPageMap")}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all
          border-l border-zinc-800/40
          ${toggles.showPageMap
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                                    }`}>
                                <MapIcon className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                                Map
                            </button>

                            {/* Source */}
                            <button
                                onClick={() => handleToggle("showSourceUrl")}
                                className={`group flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all
          rounded-r-xl border-l border-zinc-800/40
          ${toggles.showSourceUrl
                                        ? "bg-zinc-800 text-white"
                                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40"
                                    }`}>
                                <SourceUrlIcon className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
                                Source
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3 text-xs text-zinc-500 relative z-10">
                    {status ? (
                        <div className="text-emerald-400 font-medium flex items-center gap-1.5">

                            {status}
                        </div>
                    ) : (
                        <div
                            className="flex items-center gap-1.5 text-zinc-400"
                            title="Rough GPT token estimate">
                            ~
                            {tokenEstimate.toLocaleString()} tokens
                        </div>
                    )}
                    <div className="hidden sm:block w-px h-3 bg-zinc-700/50"></div>
                    <div className="hidden sm:block">
                        {markdown.length.toLocaleString()} chars
                    </div>
                </div>
            </header>

            {error && (
                <div className="px-4 py-2 text-sm text-red-400 bg-red-950/40 border-b border-red-900/40 shrink-0">
                    {error}
                </div>
            )}

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-3 min-h-0 bg-zinc-950">
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 flex flex-col overflow-hidden hover:border-zinc-700/80 transition-colors shadow-sm">
                    <div className="px-3 py-2 text-xs font-medium text-zinc-400 border-b border-zinc-800/80 bg-zinc-900/40 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            Markdown
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard
                                        .readText()
                                        .then((text) => setMarkdown(text + "\n\n" + markdown))
                                        .catch(() => { })
                                }}
                                className="hover:text-zinc-200 transition-colors flex items-center gap-1.5 group">
                                <PasteIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                <span className="hidden xl:inline">Paste</span>
                            </button>
                            <button
                                onClick={() => setMarkdown("")}
                                className="hover:text-red-400 transition-colors flex items-center gap-1.5 group">
                                <TrashIcon className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                <span className="hidden xl:inline">Clear</span>
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={markdown}
                        spellCheck={false}
                        onChange={(e) => setMarkdown(e.target.value)}
                        className="flex-1 w-full p-4 md:p-5 bg-transparent outline-none text-[13px] font-mono text-zinc-300 leading-relaxed resize-none selection:bg-emerald-500/30 placeholder-zinc-700 overflow-y-auto"
                        placeholder="Paste or write markdown here..."
                    />
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 flex flex-col overflow-hidden hover:border-zinc-700/80 transition-colors shadow-sm">
                    <div className="px-3 py-2.5 text-xs font-medium text-zinc-400 border-b border-zinc-800/80 bg-zinc-900/40">
                        Live Preview
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
                        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-zinc-200 prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-zinc-400 prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-strong:text-zinc-200 prose-code:rounded prose-li:text-zinc-400 prose-ul:marker:text-zinc-600 prose-ol:marker:text-zinc-600 prose-blockquote:border-l-zinc-700 prose-blockquote:text-zinc-400 prose-blockquote:font-normal prose-blockquote:not-italic prose-hr:border-zinc-800 prose-pre:leading-none prose-p:my-0 prose-hr:my-4">
                            <Markdown>{markdown}</Markdown>
                        </article>
                    </div>
                </div>
            </main>
        </div>
    )
}
