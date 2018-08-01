const appRoot = require('app-root-path')
const fs = require('fs-extra')
const path = require('path')
const doxygen = require('doxygen')

const packageRoot = async (opts) => {
  opts = opts || {}
  return opts.package_root || appRoot.path
}

const outputDirectory = async (opts) => {
  opts = opts || {}
  return opts.docs || 'docs'
}

const isAnyDoxygenVersionDownloaded = async (packageRoot) =>
{
    packageRoot = packageRoot || appRoot.path

    const doxygenDist = path.resolve(packageRoot, 'node_modules', 'doxygen', 'dist')
    if(!(await fs.exists(doxygenDist))) {
        return false
    }

    const files = await fs.readdir(doxygenDist)

    for(let i = 0; i < files.length; i++) {
        if(!files[i].match(/^[0-9]/)) {
            continue
        }
        if((await fs.lstat(path.join(doxygenDist, files[i]))).isDirectory()) {
            return true
        }
    }
    return false
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
    const packageRoot = packageRoot(opts)

    let projectName = opts.project_name

    if(!projectName) {
      const pkgJsonPath = path.join(packageRoot, "package.json")
      if(await fs.exists(pkgJsonPath)) {
        const pkg = require(pkgJsonPath)
        projectName = pkg.name
      }
    }

    const configPath = path.resolve(packageRoot, 'config.doxygen')

    const input = ["./Runtime"]
    const readMePath = path.resolve(packageRoot, "README.md")
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
  const packageRoot = packageRoot(opts)
  const outputDir = outputDirectory(opts)

  const indexPath = path.resolve(packageRoot, path.join(outputDir, 'index.html'))

  if(await fs.exists(indexPath)) {
    return
  }

  const defaultIndexPath = path.resolve(__dirname, '..', 'resources', 'index.html')

  await fs.copy(defaultIndexPath, indexPath)
}

const generateDocs = async (opts) => {
    await ensureDoxygenDownload(opts)
    await _generateDocs(opts)
}

module.exports = {
    ensureDoxygenDownload,
    isAnyDoxygenVersionDownloaded,
    generateDocs,
}
