// Zips build/<target> into build/<target>.zip for the browser stores.
//
// Replaces `plasmo build --zip`, whose streaming zipper produced corrupt
// entries ("invalid distance too far back") and sometimes empty files.
// Every entry is read back and checked before the script succeeds.
//
// Usage: node scripts/zip.mjs <target-dir, e.g. chrome-mv3-prod> [--with-maps]
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join, relative, sep } from "node:path"

import { unzipSync, zipSync } from "fflate"

const [target = "chrome-mv3-prod"] = process.argv.slice(2).filter(
  (arg) => !arg.startsWith("--")
)
const withMaps = process.argv.includes("--with-maps")
const root = join("build", target)
const outfile = `${root}.zip`

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const files = {}
for (const path of walk(root)) {
  if (!withMaps && path.endsWith(".map")) continue
  files[relative(root, path).split(sep).join("/")] = readFileSync(path)
}

const zipped = zipSync(files, { level: 9 })
writeFileSync(outfile, zipped)

const roundTrip = unzipSync(readFileSync(outfile))
for (const [name, data] of Object.entries(files)) {
  if (!roundTrip[name] || Buffer.compare(roundTrip[name], data) !== 0) {
    console.error(`Corrupt entry in ${outfile}: ${name}`)
    process.exit(1)
  }
}
if (!roundTrip["manifest.json"]) {
  console.error(`${outfile} has no manifest.json`)
  process.exit(1)
}

console.log(
  `${outfile}: ${Object.keys(files).length} files, ${(zipped.length / 1024 / 1024).toFixed(2)} MB (verified)`
)
