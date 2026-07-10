/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// ビルド成果物は dist/index.html の単一ファイル。
// MP3のbase64（約4MB）もJSバンドルに内包され、オフラインで動作する。
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2020',
    // base64音源をバンドルに含めるため上限を実質無効化
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 10_000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
