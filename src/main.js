import './style.css';
import { createDisguise } from './disguise.js';

const STORAGE_KEY = 'cmdsim.content';
const FETCH_ENDPOINT = 'https://asia-east1-cmdsim.cloudfunctions.net/fetchContent';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="terminal">
    <div class="terminal-titlebar">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="title" id="titlebar-text">bash — 100x40</div>
    </div>
    <div class="terminal-body" id="terminal-body">
      <div class="line-meta">Last login: ${lastLoginString()} on ttys001</div>
      <div class="input-line">
        <span class="prompt-label">user@dev-machine:<span class="path">~/project</span>$</span>
        <input
          id="cmd-input"
          class="cmd-input"
          type="text"
          spellcheck="false"
          placeholder="fetch <PTT 網址>　或直接在下方貼文字"
        />
      </div>
      <div class="hint" id="fetch-status" hidden></div>
      <textarea
        id="paste-input"
        class="paste-input"
        spellcheck="false"
        placeholder="貼上文字內容...（會自動記住，重新整理不會消失）"
      ></textarea>
      <div class="hint"># Ctrl+\` 快速切換偽裝畫面　·　# fetch &lt;PTT網址&gt; 自動抓取</div>
    </div>
    <div class="terminal-body log-body" id="disguise-body" hidden></div>
  </div>
`;

const textarea = document.querySelector('#paste-input');
const cmdInput = document.querySelector('#cmd-input');
const fetchStatus = document.querySelector('#fetch-status');
const body = document.querySelector('#terminal-body');
const disguiseBody = document.querySelector('#disguise-body');
const titlebarText = document.querySelector('#titlebar-text');
const disguise = createDisguise(disguiseBody);

let isDisguised = false;

function toggleDisguise() {
  isDisguised = !isDisguised;
  body.hidden = isDisguised;
  disguiseBody.hidden = !isDisguised;
  titlebarText.textContent = isDisguised ? 'node — npm run build' : 'bash — 100x40';
  if (isDisguised) {
    disguise.start();
  } else {
    disguise.stop();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault();
    toggleDisguise();
  }
});

textarea.value = localStorage.getItem(STORAGE_KEY) ?? '';
resizeTextarea();

textarea.addEventListener('input', () => {
  localStorage.setItem(STORAGE_KEY, textarea.value);
  resizeTextarea();
});

function resizeTextarea() {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
}

function setStatus(text, isError) {
  fetchStatus.hidden = !text;
  fetchStatus.textContent = text;
  fetchStatus.style.color = isError ? '#f14c4c' : '#6a6a6a';
}

cmdInput.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter') return;
  const raw = cmdInput.value.trim();
  if (!raw) return;

  const match = raw.match(/^fetch\s+(\S+)/i);
  if (!match) {
    setStatus(`不支援的指令：${raw}（試試 fetch <PTT網址>）`, true);
    return;
  }

  const url = match[1];
  cmdInput.disabled = true;
  setStatus(`正在抓取 ${url} ...`);

  try {
    const resp = await fetch(`${FETCH_ENDPOINT}?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

    textarea.value = `# ${data.title}\n\n${data.content}`;
    localStorage.setItem(STORAGE_KEY, textarea.value);
    resizeTextarea();
    setStatus(`已抓取：${data.title}`);
    cmdInput.value = '';
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    cmdInput.disabled = false;
    cmdInput.focus();
  }
});

function lastLoginString() {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

window.addEventListener('load', () => cmdInput.focus());
body.addEventListener('click', (e) => {
  if (e.target === body) cmdInput.focus();
});
