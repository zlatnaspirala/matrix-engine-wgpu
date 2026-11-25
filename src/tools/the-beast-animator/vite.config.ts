import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
      // Serves @mediapipe/tasks-vision WASM binaries at /mediapipe/wasm in dev and copies to dist on build.
      {
        name: 'mediapipe-wasm-assets',
        configureServer(server) {
          const wasmDir = path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm');
          server.middlewares.use('/mediapipe/wasm', (req, res, next) => {
            const cleanUrl = (req.url || '').split('?')[0].replace(/^\/+/, '');
            if (!cleanUrl || cleanUrl.includes('..')) return next();
            const target = path.join(wasmDir, cleanUrl);
            if (fs.existsSync(target)) {
              const stat = fs.statSync(target);
              if (stat.isFile()) {
                const etag = `"${stat.size}-${Math.floor(stat.mtimeMs)}"`;
                if (req.headers['if-none-match'] === etag) {
                  res.statusCode = 304;
                  res.end();
                  return;
                }
                res.statusCode = 200;
                if (target.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm');
                else if (target.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                res.setHeader('Content-Length', String(stat.size));
                res.setHeader('ETag', etag);
                res.setHeader('Cache-Control', 'public, max-age=86400');
                res.setHeader('Access-Control-Allow-Origin', '*');
                const stream = fs.createReadStream(target);
                stream.on('error', () => {
                  if (!res.headersSent) res.statusCode = 500;
                  res.end();
                });
                req.on('close', () => stream.destroy());
                stream.pipe(res);
                return;
              }
            }
            next();
          });
        },
        closeBundle(error?: Error): void {
          if (error) return;
          const wasmSrc = path.resolve(__dirname, 'node_modules/@mediapipe/tasks-vision/wasm');
          const wasmDest = path.resolve(__dirname, 'dist/mediapipe/wasm');
          if (fs.existsSync(wasmSrc)) {
            fs.cpSync(wasmSrc, wasmDest, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
