import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disable to check basic build
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-native'],
  skipNodeModulesBundle: true,
  target: 'es2020',
});