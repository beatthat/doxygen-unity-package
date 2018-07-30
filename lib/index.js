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

const _generateDocs = async (packageRoot) =>
{
    packageRoot = packageRoot || appRoot.path

    const configPath = path.resolve(packageRoot, 'config.doxygen')

    const userOptions = {
        OUTPUT_DIRECTORY: "docs",
        INPUT: "./Runtime",
        RECURSIVE: "YES",
        FILE_PATTERNS: ["*.cs", "*.md"],
        EXTENSION_MAPPING: "cs=Csharp",
        GENERATE_LATEX: "NO",
        EXCLUDE_PATTERNS: ["*/node_modules/*"]
    };


    doxygen.createConfig(userOptions, configPath)

    doxygen.run(configPath)
}

const generateDocs = async () => {
    await ensureDoxygenDownload()
    await _generateDocs()
}

module.exports = {
    ensureDoxygenDownload,
    isAnyDoxygenVersionDownloaded,
    generateDocs,
}
