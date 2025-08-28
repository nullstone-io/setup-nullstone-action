import * as core from '@actions/core'
import * as httpm from '@actions/http-client'
import * as tc from '@actions/tool-cache'
import os from 'os'

const repo = 'nullstone-io/nullstone'

export async function run() {
    const version = await getVersion()
    const downloadUrl = getDownloadUrl(version)

    core.info(`Downloading nullstone ${version} from ${downloadUrl}`)
    const downloadPath = await tc.downloadTool(downloadUrl)

    core.info(`Extracting nullstone`)
    let installPath = await tc.extractTar(downloadPath)

    core.info(`Adding nullstone to the path`)
    core.addPath(installPath)
}

async function getVersion(): Promise<string> {
    let version = core.getInput('nullstone-version')
    if (!version || version === 'latest') {
        version = await getLatestVersion()
    }
    // Drop first character 'v'
    if (version.indexOf('v') === 0) {
        version = version.substring(1)
    }
    return version
}

interface GithubRelease {
    tag_name: string;
}

async function getLatestVersion(): Promise<string> {
    core.info(`Detecting latest version from github.com/${repo} releases`)

    const res = await fetch(`https://github.com/${repo}/releases/latest`, { redirect: 'follow' })
    if (!res.url) {
        throw new Error('Could not determine final URL after redirects')
    }
    
    // Extract the version tag from the final URL
    const segments = res.url.split('/')
    const version = segments[segments.length - 1]
    if (!version) {
        throw new Error(`Could not extract version from URL: ${res.url}`)
    }
    
    return version
}

function getDownloadUrl(version: string): string {
    let platform: string = os.platform()
    switch (os.platform()) {
        case "linux":
            break
        case "win32":
            platform = "windows"
            break
        case "darwin":
            break
        default:
            throw new Error(`Platform not supported: ${os.platform()}`)
    }
    let arch: string = os.arch()
    switch (os.arch()) {
        case "arm64":
            break
        case "x64":
            arch = "amd64"
            break
        case "x32":
            arch = "386"
            break
        default:
            throw new Error(`Architecture not supported: ${os.arch()}`)
    }

    return `https://github.com/${repo}/releases/download/v${version}/nullstone_${version}_${platform}_${arch}.tar.gz`
}
