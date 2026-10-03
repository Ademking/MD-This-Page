// Plasmo bundles Parcel 2.9, whose module loader can't resolve the "node:"
// builtins that Tailwind CSS v4 depends on. Loading the plugin through Node's
// own require sidesteps that loader.
const { createRequire } = require("module")
const nodeRequire = createRequire(__filename)
const tailwindcss = nodeRequire("@tailwindcss/postcss")

/**
 * @type {import('postcss').ProcessOptions}
 */
module.exports = {
  plugins: [tailwindcss()]
}
