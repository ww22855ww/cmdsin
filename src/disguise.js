const FILES = [
  'src/components/Header.tsx', 'src/components/Footer.tsx', 'src/hooks/useAuth.ts',
  'src/utils/format.ts', 'src/pages/index.tsx', 'src/pages/dashboard.tsx',
  'src/api/client.ts', 'src/store/session.ts', 'src/lib/validators.ts',
  'src/styles/globals.css', 'src/components/Table/index.tsx', 'src/config/env.ts',
  'src/services/analytics.ts', 'src/middleware/auth.ts', 'src/models/user.ts',
];

const MODULES = [
  'react', 'react-dom', 'lodash-es', 'axios', 'zod', 'date-fns',
  'clsx', 'immer', 'zustand', '@radix-ui/react-dialog', 'framer-motion',
];

function hash(len) {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomLine() {
  const kind = Math.floor(Math.random() * 6);
  switch (kind) {
    case 0:
      return `transforming ${pick(FILES)}...`;
    case 1:
      return `✓ ${Math.floor(Math.random() * 400 + 20)} modules transformed`;
    case 2:
      return `chunk ${pick(MODULES)} → dist/assets/${pick(MODULES)}-${hash(8)}.js`;
    case 3:
      return `[vite:build] resolved ${pick(FILES)} (${(Math.random() * 20 + 1).toFixed(1)} kB)`;
    case 4:
      return `computing gzip size... ${(Math.random() * 90 + 5).toFixed(1)} kB`;
    default:
      return `cache hit: node_modules/.vite/${pick(MODULES)}/${hash(6)}.js`;
  }
}

export function createDisguise(container) {
  let timer = null;
  let lineCount = 0;
  const MAX_LINES = 300;

  function appendLine() {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = randomLine();
    container.appendChild(line);
    lineCount++;

    if (lineCount > MAX_LINES) {
      container.removeChild(container.firstChild);
    }
    container.scrollTop = container.scrollHeight;
  }

  function start() {
    if (timer) return;
    if (container.childElementCount === 0) {
      const header = document.createElement('div');
      header.className = 'log-line log-header';
      header.textContent = `> project@1.4.2 build\n> vite build --mode production`;
      container.appendChild(header);
    }
    const tick = () => {
      appendLine();
      timer = setTimeout(tick, 80 + Math.random() * 220);
    };
    tick();
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  return { start, stop };
}
