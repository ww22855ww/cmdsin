import './style.css';

const STORAGE_KEY = 'cmdsim.content';

const app = document.querySelector('#app');

app.innerHTML = `
  <div class="terminal">
    <div class="terminal-titlebar">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="title">bash — 100x40</div>
    </div>
    <div class="terminal-body" id="terminal-body">
      <div class="line-meta">Last login: ${lastLoginString()} on ttys001</div>
      <div class="line-prompt">user@dev-machine:<span class="path">~/project</span>$ cat notes.md</div>
      <textarea
        id="paste-input"
        class="paste-input"
        spellcheck="false"
        placeholder="貼上文字內容...（會自動記住，重新整理不會消失）"
      ></textarea>
      <div class="hint"># Ctrl+\` 快速切換偽裝畫面</div>
    </div>
  </div>
`;

const textarea = document.querySelector('#paste-input');
const body = document.querySelector('#terminal-body');

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

function lastLoginString() {
  const d = new Date();
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

window.addEventListener('load', () => textarea.focus());
body.addEventListener('click', () => textarea.focus());
