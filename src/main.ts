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
    let http: httpm.HttpClient = new httpm.HttpClient('setup-nullstone-action', [], {
        allowRedirects: true,
        maxRedirects: 3
    })
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const requestUrl = `https://api.github.com/repos/${repo}/releases/latest`
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        ...(
            GITHUB_TOKEN ? {
                Authorization: `Bearer ${GITHUB_TOKEN}`
            } : {}
        )
    }
    const response = await http.getJson<GithubRelease>(requestUrl, headers)
    if (response && response.result) {
        return response.result.tag_name || ''
    }
    return ''
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
