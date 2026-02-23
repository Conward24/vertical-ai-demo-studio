#!/usr/bin/env node
/**
 * Start Next.js on Railway: use PORT from env and bind 0.0.0.0.
 * Avoids shell expansion issues and ensures the app is reachable.
 */
const { spawn } = require('child_process');
const path = require('path');

const port = String(process.env.PORT || 3000);
const nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(
  process.execPath,
  [nextBin, 'start', '-p', port, '-H', '0.0.0.0'],
  {
    stdio: 'inherit',
    env: { ...process.env, PORT: port },
    cwd: path.join(__dirname, '..'),
  }
);

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal === 'SIGTERM' ? 143 : 1));
});

// Forward signals so Railway (or Ctrl+C) shuts down Next.js cleanly
['SIGTERM', 'SIGINT'].forEach((sig) => {
  process.on(sig, () => {
    child.kill(sig);
  });
});
