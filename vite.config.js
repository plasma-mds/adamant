import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  base: '/adamant/',
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
    svgr({
      svgrOptions: {
        // ...
      },
    }),
  ],
  ssr: {
    noExternal: [/@material-ui\//, /@mui\//],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './test/setup.js',
    server: {
      deps: {
        inline: [/@material-ui\/core/, /@material-ui\/icons/, /@mui\/material/],
      },
    },
    pool: 'forks',
    alias: {
      'react-dom/client': 'react-dom',
    },
  },
});
