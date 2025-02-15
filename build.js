#!/usr/bin/env node

import esbuild from 'esbuild'

const prod = process.argv.indexOf('prod') !== -1

esbuild
  .build({
    bundle: true,
    entryPoints: {
      'popup.build': './src/popup.tsx',
      'styles.build': './src/styles.css',
      'prompt.build': './src/prompt.tsx',
      'options.build': './src/options.tsx',
      'background.build': './src/background.ts',
      'content-script.build': './src/content-script.ts',
      'nostr-provider': './src/nostr-provider.ts'
    },
    outdir: './extension',
    sourcemap: prod ? false : 'inline',
    define: {
      window: 'self',
      global: 'self'
    },
    loader: {
      '.js'  : 'js',  // Ensure jsx loader for js files
      '.jsx' : 'jsx', // Ensure jsx loader for js files
      '.ts'  : 'ts',  // Use the TypeScript loader for .ts files
      '.tsx' : 'tsx'  // Use the TypeScript loader for .tsx files
    }
  })
  .then(() => console.log('build success.'))
