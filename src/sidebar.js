const LOG_TEMPLATES = [
  { level: 'ok', weight: 5, gen: () => `GET /api/v1/health 200 ${(Math.random() * 30 + 2).toFixed(0)}ms` },
  { level: 'ok', weight: 4, gen: () => `worker-${Math.floor(Math.random() * 4) + 1}: heartbeat ok` },
  { level: 'info', weight: 4, gen: () => `GC: minor collection, freed ${(Math.random() * 40 + 5).toFixed(1)}MB` },
  { level: 'info', weight: 4, gen: () => `[watch] file changed: src/${pick(['index', 'utils', 'router', 'store', 'auth'])}.ts` },
  { level: 'info', weight: 4, gen: () => `cache ${pick(['hit', 'hit', 'miss'])} ratio: ${(Math.random() * 20 + 78).toFixed(1)}%` },
  { level: 'info', weight: 3, gen: () => `conn pool: ${Math.floor(Math.random() * 12 + 2)}/20 active` },
  { level: 'ok', weight: 3, gen: () => `[queue] job#${Math.floor(Math.random() * 9000 + 1000)} completed in ${(Math.random() * 800 + 50).toFixed(0)}ms` },
  { level: 'info', weight: 3, gen: () => `DNS lookup api.internal → ${Math.floor(Math.random() * 255)}ms` },
  { level: 'warn', weight: 2, gen: () => `slow query detected: ${(Math.random() * 900 + 300).toFixed(0)}ms (threshold 300ms)` },
  { level: 'warn', weight: 2, gen: () => `retry ${Math.floor(Math.random() * 3) + 1}/3 for job#${Math.floor(Math.random() * 9000 + 1000)}` },
  { level: 'warn', weight: 1, gen: () => `memory usage above 70% on worker-${Math.floor(Math.random() * 4) + 1}` },
  { level: 'error', weight: 1, gen: () => `connection reset by peer (10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}:443)` },
  { level: 'error', weight: 1, gen: () => `unhandled rejection: ECONNREFUSED 127.0.0.1:${Math.floor(Math.random() * 9000 + 1000)}` },
];

const TOTAL_WEIGHT = LOG_TEMPLATES.reduce((sum, t) => sum + t.weight, 0);

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickTemplate() {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const t of LOG_TEMPLATES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return LOG_TEMPLATES[0];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function walk(value, min, max, step) {
  return clamp(value + (Math.random() - 0.5) * step, min, max);
}

function barLevel(pct) {
  if (pct >= 80) return 'crit';
  if (pct >= 55) return 'warn';
  return 'ok';
}

export function createSidebar(container) {
  let statTimer = null;
  let logTimer = null;
  let cpu = 20;
  let mem = 45;
  let net = 10;

  container.innerHTML = `
    <div class="sidebar-section-title">system</div>
    <div class="stat-row">
      <span class="stat-label">CPU</span>
      <span class="stat-bar"><span class="stat-bar-fill" id="bar-cpu"></span></span>
      <span class="stat-value" id="val-cpu"></span>
    </div>
    <div class="stat-row">
      <span class="stat-label">MEM</span>
      <span class="stat-bar"><span class="stat-bar-fill" id="bar-mem"></span></span>
      <span class="stat-value" id="val-mem"></span>
    </div>
    <div class="stat-row">
      <span class="stat-label">NET</span>
      <span class="stat-bar"><span class="stat-bar-fill" id="bar-net"></span></span>
      <span class="stat-value" id="val-net"></span>
    </div>
    <div class="sidebar-section-title">activity</div>
    <div class="sidebar-log" id="sidebar-log"></div>
  `;

  const barCpu = container.querySelector('#bar-cpu');
  const barMem = container.querySelector('#bar-mem');
  const barNet = container.querySelector('#bar-net');
  const valCpu = container.querySelector('#val-cpu');
  const valMem = container.querySelector('#val-mem');
  const valNet = container.querySelector('#val-net');
  const logEl = container.querySelector('#sidebar-log');

  const MAX_LOG_LINES = 60;

  function setBar(fillEl, valEl, value) {
    fillEl.style.width = `${value}%`;
    fillEl.dataset.level = barLevel(value);
    valEl.textContent = `${value.toFixed(0)}%`;
  }

  function updateStats() {
    cpu = walk(cpu, 4, 92, 18);
    mem = walk(mem, 30, 70, 6);
    net = walk(net, 2, 60, 20);

    setBar(barCpu, valCpu, cpu);
    setBar(barMem, valMem, mem);
    setBar(barNet, valNet, net);
  }

  function appendLog() {
    const template = pickTemplate();
    const line = document.createElement('div');
    line.className = 'log-line';

    const badge = document.createElement('span');
    badge.className = `log-badge log-badge-${template.level}`;
    badge.textContent = template.level.toUpperCase();

    const text = document.createElement('span');
    text.className = 'log-text';
    text.textContent = template.gen();

    line.appendChild(badge);
    line.appendChild(text);
    logEl.appendChild(line);
    while (logEl.childElementCount > MAX_LOG_LINES) {
      logEl.removeChild(logEl.firstChild);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  function start() {
    if (statTimer) return;
    updateStats();
    statTimer = setInterval(updateStats, 1400);

    const scheduleLog = () => {
      appendLog();
      logTimer = setTimeout(scheduleLog, 900 + Math.random() * 1800);
    };
    scheduleLog();
  }

  function stop() {
    clearInterval(statTimer);
    clearTimeout(logTimer);
    statTimer = null;
    logTimer = null;
  }

  return { start, stop };
}
