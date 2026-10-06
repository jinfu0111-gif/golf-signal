import { build } from 'esbuild';
import { mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/runtime/worker.js'],
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  outfile: 'dist/worker.js', loader: { '.html': 'text' }
});
console.log('Built Golf Signal v0.1');
