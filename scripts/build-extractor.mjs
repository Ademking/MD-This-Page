// Bundles the on-demand page extractor (scripts/page-extractor.ts) with
// esbuild into generated/page-extractor.js, which background.ts imports via
// Plasmo's "raw:" pipeline.
//
// Why not let Plasmo bundle it directly? Plasmo's final "utf8" compressor
// escapes non-ASCII characters one UTF-16 unit at a time and drops the low
// half of every surrogate pair. Defuddle's MathML→LaTeX tables are full of
// astral-plane characters (e.g. "𝛿" → "\delta"), so the shipped script ended
// up with corrupted strings and invalid identifiers (a syntax error). Here
// every string literal containing such characters is rewritten to an
// equivalent String.fromCodePoint(...) call, which survives any later
// minification or escaping untouched.
//
// Usage: node scripts/build-extractor.mjs [--watch]
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { parse } from "acorn"
import { fullAncestor } from "acorn-walk"
import * as esbuild from "esbuild"

const OUTFILE = "generated/page-extractor.js"
const ASTRAL = /[\u{10000}-\u{10FFFF}]/u

const PROPERTY_TYPES = new Set([
  "Property",
  "MethodDefinition",
  "PropertyDefinition"
])

const hasAstral = (node) =>
  node?.type === "Literal" &&
  typeof node.value === "string" &&
  ASTRAL.test(node.value)

const fromCodePoint = (value) =>
  `String.fromCodePoint(${Array.from(value, (c) => c.codePointAt(0)).join(",")})`

function protectAstralStrings(code) {
  const ast = parse(code, { ecmaVersion: "latest" })
  const edits = []

  // acorn-walk only visits computed keys, so plain keys ({ "𝛿": ... }) are
  // handled from their parent property node.
  fullAncestor(ast, (node) => {
    if (
      PROPERTY_TYPES.has(node.type) &&
      !node.computed &&
      hasAstral(node.key)
    ) {
      edits.push({
        start: node.key.start,
        end: node.key.end,
        text: `[${fromCodePoint(node.key.value)}]`
      })
    } else if (hasAstral(node)) {
      edits.push({
        start: node.start,
        end: node.end,
        text: fromCodePoint(node.value)
      })
    }
  })

  edits.sort((a, b) => b.start - a.start)
  for (const { start, end, text } of edits) {
    code = code.slice(0, start) + text + code.slice(end)
  }
  return code
}

const writeOutput = {
  name: "protect-astral-strings",
  setup(build) {
    build.onEnd((result) => {
      if (result.errors.length || !result.outputFiles) return
      const code = protectAstralStrings(result.outputFiles[0].text)
      mkdirSync(dirname(OUTFILE), { recursive: true })
      writeFileSync(OUTFILE, code)
      console.log(
        `page extractor → ${OUTFILE} (${(code.length / 1024).toFixed(0)} kB)`
      )
    })
  }
}

const options = {
  entryPoints: ["scripts/page-extractor.ts"],
  outfile: OUTFILE,
  write: false,
  bundle: true,
  format: "iife",
  target: ["chrome110", "firefox115", "safari16"],
  charset: "ascii",
  minify: true,
  legalComments: "none",
  alias: { "~lib": "./lib" },
  logLevel: "warning",
  plugins: [writeOutput]
}

if (process.argv.includes("--watch")) {
  const context = await esbuild.context(options)
  await context.watch()
  console.log("Watching the page extractor for changes…")
} else {
  await esbuild.build(options)
}
