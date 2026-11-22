import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = process.cwd();

async function start() {
  const args = ['dev', '--host', '127.0.0.1', ...process.argv.slice(2)];
  console.log(`\x1b[36m🚀 Starting SymphoWork SvelteKit dev server on http://127.0.0.1:5173...\x1b[0m`);

  const viteExecutable = resolve(root, 'node_modules/vite/bin/vite.js');
  const viteChild = spawn(process.execPath, [viteExecutable, ...args], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    env: process.env
  });

  const cleanup = () => {
    if (viteChild && !viteChild.killed) {
      viteChild.kill('SIGTERM');
    }
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });
  process.on('exit', cleanup);

  viteChild.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

start();
