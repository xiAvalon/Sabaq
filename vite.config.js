import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: { __ROUTER__: JSON.stringify('browser') },
  test: { environment: 'node' },
});
