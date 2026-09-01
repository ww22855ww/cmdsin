import './style.css';
import { createDisguise } from './disguise.js';
import { createSidebar } from './sidebar.js';
import { buildContentBlocks } from './noise.js';
import { renderContentBlocks } from './contentView.js';

const STORAGE_KEY = 'cmdsim.content';
const ARTICLE_KEY = 'cmdsim.article';
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
    <div class="menu-bar">
      <span>File</span><span>Edit</span><span>Selection</span><span>View</span><span>Go</span><span>Run</span><span>Terminal</span><span>Help</span>
    </div>
    <div class="ide-body">
      <div class="activity-bar">
        <button type="button" class="activity-icon active" id="activity-explorer" title="Explorer">⧉</button>
        <button type="button" class="activity-icon" id="activity-search" title="Search">🔍</button>
        <button type="button" class="activity-icon" id="activity-git" title="Source Control">⎇</button>
        <button type="button" class="activity-icon" id="activity-ext" title="Extensions">⬡</button>
      </div>
      <div class="explorer" id="explorer">
        <div class="explorer-title">EXPLORER</div>
        <div class="explorer-project">CMDSIM</div>
        <div class="explorer-tree">
          <div class="tree-row tree-folder"><span class="tree-caret">▾</span>src</div>
          <div class="tree-row tree-file tree-indent" data-file="index.js"><span class="tree-icon">JS</span>index.js</div>
          <div class="tree-row tree-file tree-indent" data-file="router.js"><span class="tree-icon">JS</span>router.js</div>
          <div class="tree-row tree-file tree-indent" data-file="store.js"><span class="tree-icon">JS</span>store.js</div>
          <div class="tree-row tree-file tree-indent" data-file="auth.js"><span class="tree-icon">JS</span>auth.js</div>
          <div class="tree-row tree-folder"><span class="tree-caret">▾</span>components</div>
          <div class="tree-row tree-file tree-indent" data-file="Header.tsx"><span class="tree-icon">TS</span>Header.tsx</div>
          <div class="tree-row tree-file tree-indent" data-file="Footer.tsx"><span class="tree-icon">TS</span>Footer.tsx</div>
          <div class="tree-row tree-file" data-file="package.json"><span class="tree-icon">{}</span>package.json</div>
          <div class="tree-row tree-file" data-file="README.md"><span class="tree-icon">MD</span>README.md</div>
          <div class="tree-row tree-file tree-active" id="explorer-active-file" data-file="untitled.md"><span class="tree-icon">MD</span><span id="explorer-active-label">untitled.md</span></div>
        </div>
      </div>
      <div class="terminal-panes">
      <div class="terminal-main">
        <div class="tab-bar">
          <div class="tab active">
            <span class="tab-icon">MD</span>
            <span class="tab-label" id="tab-label">untitled.md</span>
            <span class="tab-close">×</span>
          </div>
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
              placeholder="fetch <PTT 網址>　或 search <看板> <關鍵字>　或直接在下方貼文字"
            />
          </div>
          <div class="hint" id="fetch-status" hidden></div>
          <div class="view-actions">
            <button type="button" class="back-to-list" id="back-to-list" hidden>← 返回文章列表</button>
            <button type="button" class="back-to-list" id="back-to-paste" hidden>✎ 手動貼上文字</button>
          </div>
          <div class="list-view" id="list-view" hidden>
            <div class="list-header" id="list-header"></div>
            <div class="list-search" id="list-search" hidden>
              <input type="text" id="list-search-input" class="list-search-input" placeholder="搜尋看板內文章..." />
              <button type="button" class="icon-btn" id="list-search-btn">🔍 搜尋</button>
            </div>
            <div class="list-extra" id="list-extra"></div>
            <div class="list-items" id="list-items"></div>
            <div class="list-pager" id="list-pager">
              <button type="button" class="icon-btn" id="list-prev" disabled>‹ 上頁（較舊）</button>
              <button type="button" class="icon-btn" id="list-next" disabled>下頁（較新）›</button>
            </div>
          </div>
          <div class="article-view" id="article-view" hidden></div>
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
    <div class="status-bar">
      <span class="status-item">⎇ main</span>
      <span class="status-item">✓ 0&nbsp;&nbsp;⚠ 0</span>
      <span class="status-spacer"></span>
      <span class="status-item" id="status-lang">Plain Text</span>
      <span class="status-item">UTF-8</span>
      <span class="status-item">LF</span>
      <span class="status-item">Ln 1, Col 1</span>
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
const backToPasteBtn = document.querySelector('#back-to-paste');
const listView = document.querySelector('#list-view');
const articleView = document.querySelector('#article-view');
const listHeader = document.querySelector('#list-header');
const listExtra = document.querySelector('#list-extra');
const listSearch = document.querySelector('#list-search');
const listSearchInput = document.querySelector('#list-search-input');
const listSearchBtn = document.querySelector('#list-search-btn');
const listItems = document.querySelector('#list-items');
const listPager = document.querySelector('#list-pager');
const listPrevBtn = document.querySelector('#list-prev');
const listNextBtn = document.querySelector('#list-next');
const explorer = document.querySelector('#explorer');
const explorerActiveFile = document.querySelector('#explorer-active-file');
const explorerActiveLabel = document.querySelector('#explorer-active-label');
const tabLabel = document.querySelector('#tab-label');
const statusLang = document.querySelector('#status-lang');
const activityIcons = document.querySelectorAll('.activity-icon');
const activityExplorer = document.querySelector('#activity-explorer');
const disguise = createDisguise(disguiseBody);
const sidebar = createSidebar(sidebarEl);

sidebar.start();

activityIcons.forEach((btn) => {
  btn.addEventListener('click', () => {
    activityIcons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn === activityExplorer) {
      explorer.hidden = false;
    } else {
      explorer.hidden = true;
    }
  });
});

function setOpenFile(name, lang) {
  tabLabel.textContent = name;
  explorerActiveLabel.textContent = name;
  explorerActiveFile.dataset.file = name;
  statusLang.textContent = lang;
}

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

function jumpParagraphInTextarea(direction) {
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

function jumpParagraphInArticle(direction) {
  const blocks = Array.from(articleView.children);
  if (!blocks.length) return;

  const bodyRect = body.getBoundingClientRect();
  const centerY = bodyRect.top + bodyRect.height / 3;
  let idx = 0;
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].getBoundingClientRect().top <= centerY) idx = i;
    else break;
  }
  const targetIdx = Math.max(0, Math.min(blocks.length - 1, idx + direction));
  blocks[targetIdx].scrollIntoView({ block: 'center' });
}

window.addEventListener('keydown', (e) => {
  if (!e.altKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  const direction = e.key === 'ArrowDown' ? 1 : -1;
  if (!textarea.hidden) {
    e.preventDefault();
    jumpParagraphInTextarea(direction);
  } else if (!articleView.hidden) {
    e.preventDefault();
    jumpParagraphInArticle(direction);
  }
});

function setStatus(text, isError) {
  fetchStatus.hidden = !text;
  fetchStatus.textContent = text;
  fetchStatus.style.color = isError ? 'var(--error-color)' : 'var(--muted-color)';
}

let lastListState = null;
let currentBoard = null;

function doSearch(board, query) {
  if (!board || !query) return;
  doFetch(`https://www.ptt.cc/bbs/${board}/search?q=${encodeURIComponent(query)}`);
}

listSearchBtn.addEventListener('click', () => doSearch(currentBoard, listSearchInput.value.trim()));
listSearchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doSearch(currentBoard, listSearchInput.value.trim());
});

function showPaste() {
  articleView.hidden = true;
  listView.hidden = true;
  textarea.hidden = false;
  backToPasteBtn.hidden = true;
  backToListBtn.hidden = !lastListState;
  textarea.focus();
  setOpenFile('draft.md', 'Markdown');
}

function showArticle(title, content) {
  localStorage.setItem(ARTICLE_KEY, JSON.stringify({ title, content }));
  renderContentBlocks(articleView, title, buildContentBlocks(content));

  listView.hidden = true;
  textarea.hidden = true;
  articleView.hidden = false;
  backToListBtn.hidden = !lastListState;
  backToPasteBtn.hidden = false;
  setOpenFile('article.md', 'Markdown');
}

backToPasteBtn.addEventListener('click', () => {
  localStorage.removeItem(ARTICLE_KEY);
  showPaste();
});

function showList(data) {
  lastListState = data;
  listView.hidden = false;
  textarea.hidden = true;
  articleView.hidden = true;
  backToListBtn.hidden = true;
  backToPasteBtn.hidden = true;
  setOpenFile('README.md', 'Markdown');

  const isMan = data.kind === 'man';
  const isSearch = data.kind === 'search';

  if (isMan) {
    listHeader.textContent = `# 精華區 ${data.board}（共 ${data.items.length} 項）`;
  } else if (isSearch) {
    listHeader.textContent = `# 搜尋「${data.query}」in 看板 ${data.board}（第 ${data.page} 頁，共 ${data.items.length} 篇）`;
  } else {
    const pageLabel = data.page ? `第 ${data.page} 頁` : '最新';
    listHeader.textContent = `# 看板 ${data.board}（${pageLabel}，共 ${data.items.length} 篇）`;
  }

  currentBoard = data.board;
  listSearch.hidden = isMan;
  listSearchInput.value = isSearch ? data.query : '';

  listExtra.innerHTML = '';
  if (isMan) {
    if (data.parentUrl) {
      listExtra.appendChild(makeExtraLink('↑ 上一層', data.parentUrl));
    }
    if (data.boardUrl) {
      listExtra.appendChild(makeExtraLink('📋 回看板', data.boardUrl));
    }
  } else {
    if (isSearch) {
      listExtra.appendChild(makeExtraLink('📋 回看板', `https://www.ptt.cc/bbs/${data.board}/index.html`));
    }
    if (data.manUrl) {
      listExtra.appendChild(makeExtraLink('📚 精華區', data.manUrl));
    }
  }

  listItems.innerHTML = '';
  data.items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'list-item';

    const link = document.createElement('a');
    link.href = '#';
    link.className = 'list-item-title';
    link.textContent = (item.isFolder ? '📁 ' : '') + item.title;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      doFetch(item.url);
    });

    row.appendChild(link);

    if (!isMan) {
      const meta = document.createElement('span');
      meta.className = 'list-item-meta';
      meta.textContent = `${item.author || '?'} · ${item.date || ''}${item.push ? ' · 推' + item.push : ''}`;
      row.appendChild(meta);
    }

    listItems.appendChild(row);
  });

  listPager.hidden = isMan;
  listPrevBtn.disabled = !data.prevUrl;
  listNextBtn.disabled = !data.nextUrl;
  listPrevBtn.onclick = () => data.prevUrl && doFetch(data.prevUrl);
  listNextBtn.onclick = () => data.nextUrl && doFetch(data.nextUrl);
}

function makeExtraLink(label, url) {
  const link = document.createElement('a');
  link.href = '#';
  link.className = 'list-extra-link';
  link.textContent = label;
  link.addEventListener('click', (e) => {
    e.preventDefault();
    doFetch(url);
  });
  return link;
}

backToListBtn.addEventListener('click', () => {
  if (lastListState) showList(lastListState);
});

const savedArticle = localStorage.getItem(ARTICLE_KEY);
if (savedArticle) {
  try {
    const parsed = JSON.parse(savedArticle);
    showArticle(parsed.title, parsed.content);
  } catch {
    showPaste();
  }
} else {
  showPaste();
}

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
      showArticle(data.title, data.content);
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

  const fetchMatch = raw.match(/^fetch\s+(\S+)/i);
  if (fetchMatch) {
    doFetch(fetchMatch[1]);
    return;
  }

  const searchMatch = raw.match(/^search\s+(\S+)\s+(.+)/i);
  if (searchMatch) {
    doSearch(searchMatch[1], searchMatch[2].trim());
    return;
  }

  setStatus(`不支援的指令：${raw}（試試 fetch <PTT網址/看板網址> 或 search <看板> <關鍵字>）`, true);
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
