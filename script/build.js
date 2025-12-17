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

// Generate manifest for the target browser
function generateManifest(targetBrowser) {
  const manifestDir = path.join(rootDir, 'src', 'manifest')
  const distDir = path.join(rootDir, 'dist')

  // Read base manifest
  const baseManifest = JSON.parse(
    fs.readFileSync(path.join(manifestDir, 'base.json'), 'utf-8')
  )

  // Read browser-specific manifest
  const browserManifest = JSON.parse(
    fs.readFileSync(path.join(manifestDir, `${targetBrowser}.json`), 'utf-8')
  )

  // Merge manifests (browser-specific overrides base)
  const finalManifest = { ...baseManifest, ...browserManifest }

  // Write to dist
  fs.writeFileSync(
    path.join(distDir, 'manifest.json'),
    JSON.stringify(finalManifest, null, 2)
  )

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
