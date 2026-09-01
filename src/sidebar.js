const LOG_TEMPLATES = [
  () => `GET /api/v1/health 200 ${(Math.random() * 30 + 2).toFixed(0)}ms`,
  () => `GC: minor collection, freed ${(Math.random() * 40 + 5).toFixed(1)}MB`,
  () => `[watch] file changed: src/${pick(['index', 'utils', 'router', 'store', 'auth'])}.ts`,
  () => `cache ${pick(['hit', 'hit', 'miss'])} ratio: ${(Math.random() * 20 + 78).toFixed(1)}%`,
  () => `worker-${Math.floor(Math.random() * 4) + 1}: heartbeat ok`,
  () => `conn pool: ${Math.floor(Math.random() * 12 + 2)}/20 active`,
  () => `[queue] job#${Math.floor(Math.random() * 9000 + 1000)} completed in ${(Math.random() * 800 + 50).toFixed(0)}ms`,
  () => `DNS lookup api.internal → ${Math.floor(Math.random() * 255)}ms`,
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function walk(value, min, max, step) {
  return clamp(value + (Math.random() - 0.5) * step, min, max);
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

  function updateStats() {
    cpu = walk(cpu, 4, 85, 18);
    mem = walk(mem, 30, 70, 6);
    net = walk(net, 2, 60, 20);

    barCpu.style.width = `${cpu}%`;
    barMem.style.width = `${mem}%`;
    barNet.style.width = `${net}%`;
    valCpu.textContent = `${cpu.toFixed(0)}%`;
    valMem.textContent = `${mem.toFixed(0)}%`;
    valNet.textContent = `${net.toFixed(0)}%`;
  }

  function appendLog() {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = pick(LOG_TEMPLATES)();
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
