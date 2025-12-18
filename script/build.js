#!/usr/bin/env node

import esbuild from 'esbuild'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Parse command line arguments
const args = process.argv.slice(2)
const prod = args.includes('--prod')
const browser = args.includes('--firefox') ? 'firefox' : 'chrome'

console.log(`Building for ${browser}${prod ? ' (production)' : ' (development)'}...`)

function readManifestFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Manifest generation failed: required file missing at ${filePath}`)
    process.exit(1)
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(
      `Manifest generation failed reading or parsing ${filePath}: ${error?.message || error}`
    )
    process.exit(1)
  }
}

function writeManifestFile(filePath, manifest) {
  try {
    const serialized = JSON.stringify(manifest, null, 2)
    fs.writeFileSync(filePath, serialized)
  } catch (error) {
    console.error(
      `Manifest generation failed writing ${filePath}: ${error?.message || error}`
    )
    process.exit(1)
  }
}

// Generate manifest for the target browser
function generateManifest(targetBrowser) {
  const manifestDir = path.join(rootDir, 'src', 'manifest')
  const distDir = path.join(rootDir, 'dist')
  const baseManifestPath = path.join(manifestDir, 'base.json')
  const browserManifestPath = path.join(manifestDir, `${targetBrowser}.json`)
  const outputManifestPath = path.join(distDir, 'manifest.json')

  const baseManifest = readManifestFile(baseManifestPath)
  const browserManifest = readManifestFile(browserManifestPath)

  // Merge manifests (browser-specific overrides base)
  const finalManifest = { ...baseManifest, ...browserManifest }

  // Write to dist
  writeManifestFile(outputManifestPath, finalManifest)

  console.log(`Generated manifest.json for ${targetBrowser}`)
}

// Run esbuild
esbuild
  .build({
    bundle: true,
    entryPoints: {
      'popup.build'            : './src/popup.tsx',
      'prompt.build'           : './src/prompt.tsx',
      'options.build'          : './src/options.tsx',
      'background.build'       : './src/background.ts',
      'content-script.build'   : './src/content-script.ts',
      'nostr-provider.build'   : './src/providers/nostr-provider.ts',
      'bitcoin-provider.build' : './src/providers/bitcoin-provider.ts',
      'global.styles.build'    : './src/styles/global.css',
      'options.styles.build'   : './src/styles/options.css',
      'popup.styles.build'     : './src/styles/popup.css',
      'prompt.styles.build'    : './src/styles/prompt.css'
    },
    outdir: './dist',
    sourcemap: prod ? false : 'inline',
    define: {
      window: 'self',
      global: 'self'
    },
    loader: {
      '.js'  : 'js',
      '.jsx' : 'jsx',
      '.ts'  : 'ts',
      '.tsx' : 'tsx',
      '.css' : 'css'
    }
  })
  .then(() => {
    generateManifest(browser)
    console.log('Build success.')
  })
  .catch((error) => {
    console.error('Build failed:', error)
    process.exit(1)
  })
