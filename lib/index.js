const appRoot = require('app-root-path')
const fs = require('fs-extra')
const path = require('path')
const doxygen = require('doxygen')

const isAnyDoxygenVersionDownloaded = async(packageRoot) =>
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
    const packageRoot = opts.package_root || appRoot.path

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
        OUTPUT_DIRECTORY: "docs",
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

const generateDocs = async (opts) => {
    await ensureDoxygenDownload(opts)
    await _generateDocs(opts)
}

module.exports = {
    ensureDoxygenDownload,
    isAnyDoxygenVersionDownloaded,
    generateDocs,
}
