import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  minify: true,
  sourcemap: true,
  splitting: false,
  shims: true,
  external: [],
  target: 'node14',
  platform: 'node',
  env: {
    NODE_ENV: 'production'
  }
});