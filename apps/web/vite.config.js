import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

const reactPackagePath = fileURLToPath(new URL('./node_modules/react', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    // Keep the web app on a single React instance even when the workspace root
    // also has mobile/web dependencies installed with their own nested copies.
    alias: [
      { find: /^react$/, replacement: reactPackagePath },
      { find: /^react\/(.*)$/, replacement: `${reactPackagePath}/$1` },
    ],
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  plugins: [react(), tailwindcss()],
});
