const appRoot = require('app-root-path')
const fs = require('fs-extra')
const path = require('path')
const doxygen = require('doxygen')

const packageRoot = (opts) => {
  opts = opts || {}
  return opts.package_root || appRoot.path
}

const outputDirectory = (opts) => {
  opts = opts || {}
  return opts.docs || 'docs'
}

const isAnyDoxygenVersionDownloaded = async (pkgRoot) =>
{
  // leave marked async in case this check needs to be async later
    return doxygen.isDoxygenExecutableInstalled()
}

const ensureDoxygenDownload = async () => {

    if(await isAnyDoxygenVersionDownloaded()) {
        return
    }

    await doxygen.downloadVersion()
}

const _generateDocs = async (opts) =>
{
    opts = opts || {}
    const pkgRoot = packageRoot(opts)

    let projectName = opts.project_name

    if(!projectName) {
      const pkgJsonPath = path.join(pkgRoot, "package.json")
      if(await fs.exists(pkgJsonPath)) {
        const pkg = require(pkgJsonPath)
        projectName = pkg.name
      }
    }

    const configPath = path.resolve(pkgRoot, 'config.doxygen')

    const input = ["./Runtime"]
    const readMePath = path.resolve(pkgRoot, "README.md")
    const useReadMe = await fs.exists(readMePath)

    if(useReadMe) {
      input.push(readMePath)
    }

    const userOptions = {
        PROJECT_NAME: projectName || undefined,
        OUTPUT_DIRECTORY: outputDirectory(opts),
        INPUT: useReadMe? [readMePath, "./Runtime"]: ["./Runtime"],
        RECURSIVE: "YES",
        FILE_PATTERNS: ["*.cs", "*.md"],
        EXTENSION_MAPPING: "cs=Csharp",
        GENERATE_LATEX: "NO",
        EXCLUDE_PATTERNS: ["*/node_modules/*"]
    }

    if(useReadMe) {
      userOptions.USE_MDFILE_AS_MAINPAGE = readMePath
    }

    doxygen.createConfig(userOptions, configPath)

    doxygen.run(configPath)
}

const ensureDocIndex = async (opts) => {
  const pkgRoot = packageRoot(opts)
  const outputDir = outputDirectory(opts)

  const indexPath = path.resolve(pkgRoot, path.join(outputDir, 'index.html'))

  if(await fs.exists(indexPath)) {
    return
  }

  const defaultIndexPath = path.resolve(__dirname, '..', 'resources', 'index.html')

  await fs.copy(defaultIndexPath, indexPath)
}

const generateDocs = async (opts) => {
    await ensureDoxygenDownload(opts)
    await _generateDocs(opts)
    await ensureDocIndex(opts)
}

module.exports = {
    ensureDoxygenDownload,
    isAnyDoxygenVersionDownloaded,
    generateDocs
}
