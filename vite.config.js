import { fileURLToPath } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  build:{
    rollupOptions:{
      output:{
        entryFileNames:"index.js",
        assetFileNames:"index.css",
      }
    }
      },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
