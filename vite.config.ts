import { defineConfig } from 'vite'
import { resolve } from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'src/manifest.json', dest: '.', rename: { stripBase: true } },
        { src: 'src/icons/*', dest: 'icons', rename: { stripBase: true } }
      ]
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV !== 'production'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
