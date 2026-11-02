// Builds the whole game into one self-contained HTML file (used for the hosted demo).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { __ROUTER__: JSON.stringify('memory') },
  build: { outDir: 'dist-single', emptyOutDir: true },
});
