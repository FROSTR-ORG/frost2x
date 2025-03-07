#!/usr/bin/env node

import esbuild from 'esbuild'

const prod = process.argv.indexOf('prod') !== -1

esbuild
  .build({
    bundle: true,
    entryPoints: {
      'popup.build'          : './src/popup.tsx',
      'prompt.build'         : './src/prompt.tsx',
      'options.build'        : './src/options.tsx',
      'background.build'     : './src/background.ts',
      'content-script.build' : './src/content-script.ts',
      'nostr-provider'       : './src/nostr-provider.ts',
      'global.styles.build'  : './src/styles/global.css',
      'options.styles.build' : './src/styles/options.css',
      'popup.styles.build'   : './src/styles/popup.css',
      'prompt.styles.build'  : './src/styles/prompt.css'
    },
    outdir: './extension',
    sourcemap: prod ? false : 'inline',
    define: {
      window: 'self',
      global: 'self'
    },
    loader: {
      '.js'  : 'js',   // Ensure jsx loader for js files
      '.jsx' : 'jsx',  // Ensure jsx loader for js files
      '.ts'  : 'ts',   // Use the TypeScript loader for .ts files
      '.tsx' : 'tsx',  // Use the TypeScript loader for .tsx files
      '.css' : 'css'   // Add this line to handle CSS imports correctly
    }
  })
  .then(() => console.log('build success.'))
