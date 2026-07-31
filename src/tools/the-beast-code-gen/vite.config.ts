import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * @description
 * You must change 'publicDir' if you use code-creator out of engine git repo.
 * This is just path to the standard public folder of engine project.
 */
const PUBLIC_DIR =  "../../../public/";

export default defineConfig(() => {
  return {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    publicDir: PUBLIC_DIR,
    build: {
      outDir: PUBLIC_DIR,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
