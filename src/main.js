import './style.css';
import { createDisguise } from './disguise.js';
import { createSidebar } from './sidebar.js';
import { interleaveNoise } from './noise.js';

const STORAGE_KEY = 'cmdsim.content';
const THEME_KEY = 'cmdsim.theme';
const SIDEBAR_WIDTH_KEY = 'cmdsim.sidebarWidth';
const FONT_SIZE_KEY = 'cmdsim.fontSize';
const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 640;
const SIDEBAR_DEFAULT = 300;
const FONT_MIN = 12;
const FONT_MAX = 22;
const FONT_DEFAULT = 14;
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
      <div class="titlebar-actions">
        <button type="button" class="icon-btn" id="font-dec" title="縮小字體">A−</button>
        <button type="button" class="icon-btn" id="font-inc" title="放大字體">A+</button>
        <button type="button" class="theme-toggle" id="theme-toggle" title="切換深/淺色主題"></button>
      </div>
    </div>
    <div class="terminal-panes">
      <div class="terminal-main">
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
          <button type="button" class="back-to-list" id="back-to-list" hidden>← 返回文章列表</button>
          <div class="list-view" id="list-view" hidden>
            <div class="list-header" id="list-header"></div>
            <div class="list-items" id="list-items"></div>
            <div class="list-pager">
              <button type="button" class="icon-btn" id="list-prev" disabled>‹ 上頁（較舊）</button>
              <button type="button" class="icon-btn" id="list-next" disabled>下頁（較新）›</button>
            </div>
          </div>
          <textarea
            id="paste-input"
            class="paste-input"
            spellcheck="false"
            placeholder="貼上文字內容...（會自動記住，重新整理不會消失）"
          ></textarea>
          <div class="hint"># Ctrl+\` 偽裝切換　·　# fetch &lt;PTT網址/看板網址&gt; 抓取　·　# Alt+↑/↓ 段落跳轉</div>
        </div>
        <div class="terminal-body log-body" id="disguise-body" hidden></div>
      </div>
      <div class="pane-resizer" id="pane-resizer"></div>
      <div class="terminal-sidebar" id="terminal-sidebar"></div>
    </div>
  </div>
`;

const textarea = document.querySelector('#paste-input');
const cmdInput = document.querySelector('#cmd-input');
const fetchStatus = document.querySelector('#fetch-status');
const body = document.querySelector('#terminal-body');
const disguiseBody = document.querySelector('#disguise-body');
const titlebarText = document.querySelector('#titlebar-text');
const themeToggle = document.querySelector('#theme-toggle');
const fontDec = document.querySelector('#font-dec');
const fontInc = document.querySelector('#font-inc');
const sidebarEl = document.querySelector('#terminal-sidebar');
const resizer = document.querySelector('#pane-resizer');
const backToListBtn = document.querySelector('#back-to-list');
const listView = document.querySelector('#list-view');
const listHeader = document.querySelector('#list-header');
const listItems = document.querySelector('#list-items');
const listPrevBtn = document.querySelector('#list-prev');
const listNextBtn = document.querySelector('#list-next');
const disguise = createDisguise(disguiseBody);
const sidebar = createSidebar(sidebarEl);

sidebar.start();

function setSidebarWidth(px) {
  const clamped = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, px));
  sidebarEl.style.width = `${clamped}px`;
  return clamped;
}

const savedWidth = parseInt(localStorage.getItem(SIDEBAR_WIDTH_KEY), 10);
setSidebarWidth(Number.isFinite(savedWidth) ? savedWidth : SIDEBAR_DEFAULT);

resizer.addEventListener('mousedown', (e) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = sidebarEl.getBoundingClientRect().width;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  function onMove(ev) {
    const delta = startX - ev.clientX;
    setSidebarWidth(startWidth + delta);
  }
  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarEl.getBoundingClientRect().width.toFixed(0));
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

resizer.addEventListener('dblclick', () => {
  setSidebarWidth(SIDEBAR_DEFAULT);
  localStorage.setItem(SIDEBAR_WIDTH_KEY, String(SIDEBAR_DEFAULT));
});

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

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'light' ? '☀ light' : '☾ dark';
  localStorage.setItem(THEME_KEY, theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  applyTheme(current === 'light' ? 'dark' : 'light');
});

applyTheme(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark');

function setFontSize(px) {
  const clamped = Math.max(FONT_MIN, Math.min(FONT_MAX, px));
  body.style.setProperty('--content-font-size', `${clamped}px`);
  localStorage.setItem(FONT_SIZE_KEY, String(clamped));
  return clamped;
}

const savedFontSize = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10);
setFontSize(Number.isFinite(savedFontSize) ? savedFontSize : FONT_DEFAULT);

fontDec.addEventListener('click', () => {
  setFontSize(parseFloat(getComputedStyle(body).fontSize) - 1);
  resizeTextarea();
});
fontInc.addEventListener('click', () => {
  setFontSize(parseFloat(getComputedStyle(body).fontSize) + 1);
  resizeTextarea();
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

const mirror = document.createElement('div');
mirror.style.cssText = 'position:fixed; top:0; left:-9999px; visibility:hidden; white-space:pre-wrap; word-break:break-word;';
document.body.appendChild(mirror);

function scrollToTextareaIndex(index) {
  const style = getComputedStyle(textarea);
  mirror.style.font = style.font;
  mirror.style.width = style.width;
  mirror.style.padding = style.padding;
  mirror.style.lineHeight = style.lineHeight;
  mirror.textContent = textarea.value.slice(0, index);
  const target = textarea.offsetTop + mirror.scrollHeight - body.clientHeight / 3;
  body.scrollTop = Math.max(0, target);
}

function jumpParagraph(direction) {
  const value = textarea.value;
  const boundaries = [0];
  const regex = /\n\s*\n/g;
  let m;
  while ((m = regex.exec(value))) {
    boundaries.push(m.index + m[0].length);
  }
  boundaries.push(value.length);

  const cursor = textarea.selectionStart;
  let target;
  if (direction > 0) {
    target = boundaries.find((b) => b > cursor + 1) ?? value.length;
  } else {
    const before = boundaries.filter((b) => b < cursor - 1);
    target = before.length ? before[before.length - 1] : 0;
  }

  textarea.focus();
  textarea.setSelectionRange(target, target);
  scrollToTextareaIndex(target);
}

textarea.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'ArrowDown') {
    e.preventDefault();
    jumpParagraph(1);
  } else if (e.altKey && e.key === 'ArrowUp') {
    e.preventDefault();
    jumpParagraph(-1);
  }
});

function setStatus(text, isError) {
  fetchStatus.hidden = !text;
  fetchStatus.textContent = text;
  fetchStatus.style.color = isError ? 'var(--error-color)' : 'var(--muted-color)';
}

let lastListState = null;

function showArticle(data) {
  listView.hidden = true;
  textarea.hidden = false;
  backToListBtn.hidden = !lastListState;

  textarea.value = `# ${data.title}\n\n${interleaveNoise(data.content)}`;
  localStorage.setItem(STORAGE_KEY, textarea.value);
  resizeTextarea();
}

function showList(data) {
  lastListState = data;
  listView.hidden = false;
  textarea.hidden = true;
  backToListBtn.hidden = true;

  const pageLabel = data.page ? `第 ${data.page} 頁` : '最新';
  listHeader.textContent = `# 看板 ${data.board}（${pageLabel}，共 ${data.items.length} 篇）`;

  listItems.innerHTML = '';
  data.items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'list-item';

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'list-item-title';
    link.textContent = item.title;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      doFetch(item.url);
    });

    const meta = document.createElement('span');
    meta.className = 'list-item-meta';
    meta.textContent = `${item.author || '?'} · ${item.date || ''}${item.push ? ' · 推' + item.push : ''}`;

    row.appendChild(link);
    row.appendChild(meta);
    listItems.appendChild(row);
  });

  listPrevBtn.disabled = !data.prevUrl;
  listNextBtn.disabled = !data.nextUrl;
  listPrevBtn.onclick = () => data.prevUrl && doFetch(data.prevUrl);
  listNextBtn.onclick = () => data.nextUrl && doFetch(data.nextUrl);
}

backToListBtn.addEventListener('click', () => {
  if (lastListState) showList(lastListState);
});

async function doFetch(url) {
  cmdInput.disabled = true;
  setStatus(`正在抓取 ${url} ...`);

  try {
    const resp = await fetch(`${FETCH_ENDPOINT}?url=${encodeURIComponent(url)}`);
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);

    if (data.type === 'list') {
      showList(data);
      setStatus(`看板 ${data.board}：共 ${data.items.length} 篇文章`);
    } else {
      showArticle(data);
      setStatus(`已抓取：${data.title}`);
    }
    cmdInput.value = '';
  } catch (err) {
    setStatus(err.message, true);
  } finally {
    cmdInput.disabled = false;
    cmdInput.focus();
  }
}

cmdInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const raw = cmdInput.value.trim();
  if (!raw) return;

  const match = raw.match(/^fetch\s+(\S+)/i);
  if (!match) {
    setStatus(`不支援的指令：${raw}（試試 fetch <PTT網址/看板網址>）`, true);
    return;
  }

  doFetch(match[1]);
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
