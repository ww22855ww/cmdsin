function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hash(len) {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// Each generator returns { lang, code } where lang is a highlight.js
// language id (or 'plaintext' for things like stack traces/log lines
// that don't tokenize meaningfully as a "language").
const SNIPPETS = [
  () => ({ lang: 'javascript', code: `console.log('checkpoint ${pick('ABCDEFGH')}', state.length);` }),
  () => ({ lang: 'javascript', code: `const config = require('./config/${pick(['dev', 'staging', 'prod'])}.json');` }),
  () => ({ lang: 'javascript', code: `req.headers['x-request-id'] = '${hash(12)}';` }),
  () => ({ lang: 'javascript', code: `expect(response.status).toBe(${pick([200, 201, 204])});` }),
  () => ({
    lang: 'javascript',
    code: [
      `function debounce(fn, wait) {`,
      `  let t;`,
      `  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };`,
      `}`,
    ].join('\n'),
  }),
  () => ({
    lang: 'javascript',
    code: [
      `TypeError: Cannot read properties of undefined (reading 'map')`,
      `    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
    ].join('\n'),
  }),
  () => ({ lang: 'python', code: `assert dataset.shape == (${rand(32, 256)}, ${rand(16, 128)})  # sanity check` }),
  () => ({ lang: 'python', code: `>>> len(results)\n${rand(100, 999)}` }),
  () => ({
    lang: 'python',
    code: [`def handle(event):`, `    payload = json.loads(event["body"])`, `    return {"statusCode": 200, "body": json.dumps(payload)}`].join(
      '\n'
    ),
  }),
  () => ({
    lang: 'python',
    code: [`class Cache:`, `    def __init__(self, ttl=${rand(30, 600)}):`, `        self._store = {}`, `        self.ttl = ttl`].join('\n'),
  }),
  () => ({
    lang: 'python',
    code: [`Traceback (most recent call last):`, `  File "main.py", line ${rand(20, 400)}, in <module>`, `IndexError: list index out of range`].join(
      '\n'
    ),
  }),
  () => ({ lang: 'sql', code: [`SELECT * FROM sessions WHERE user_id = ${rand(1000, 9999)};`, `-- ${rand(1, 40)} rows in set (${(Math.random() * 0.2).toFixed(3)} sec)`].join('\n') }),
  () => ({
    lang: 'bash',
    code: [`curl -s -X POST https://api.internal/v2/jobs \\`, `  -H "Authorization: Bearer ${hash(24)}" \\`, `  -d '{"priority":"${pick(['low', 'normal', 'high'])}"}'`].join('\n'),
  }),
  () => ({ lang: 'bash', code: `retrying in ${(Math.random() * 3 + 0.5).toFixed(1)}s (attempt ${rand(1, 4)}/5)` }),
  () => ({
    lang: 'bash',
    code: [`+ git commit -m "wip: fix edge case"`, `[main ${hash(7)}] wip: fix edge case`, ` 1 file changed, ${rand(1, 20)} insertions(+), ${rand(0, 5)} deletions(-)`].join('\n'),
  }),
  () => ({ lang: 'plaintext', code: `[DEBUG] cache miss for key user:${rand(1000, 9999)}, refetching...` }),
  () => ({ lang: 'plaintext', code: `[WARN] deprecated API call: db.find() → use db.findOne()` }),
  () => ({ lang: 'plaintext', code: `[INFO] flushing write buffer (${rand(1, 64)}KB)` }),
  () => ({ lang: 'plaintext', code: `# TODO: refactor this before it breaks in prod` }),
  () => ({ lang: 'plaintext', code: `# NOTE: revert this once the upstream fix ships` }),
  () => ({ lang: 'plaintext', code: `worker-${rand(1, 6)}: task #${rand(1000, 9999)} ack` }),
  () => ({
    lang: 'plaintext',
    code: [`WARNING: pool exhausted, spawning ${rand(1, 4)} extra worker(s)`, `worker-${rand(5, 9)}: spawned, pid ${rand(1000, 32000)}`].join('\n'),
  }),
];

function randomNoiseBlock() {
  const block = pick(SNIPPETS)();
  if (Math.random() < 0.25) {
    const second = pick(SNIPPETS)();
    if (second.lang === block.lang) {
      return { lang: block.lang, code: `${block.code}\n${second.code}` };
    }
  }
  return block;
}

function splitSentences(paragraph) {
  return paragraph.split(/(?<=[。！？.!?])/).filter((s) => s.trim().length > 0);
}

/**
 * Splits article text into prose chunks and randomly interleaves fake
 * code/log snippets both between paragraphs and mid-paragraph (at
 * sentence boundaries), so long blocks of prose don't stay clumped
 * together. Returns an ordered list of blocks ready for structured
 * (syntax-highlighted) rendering:
 *   { type: 'prose', text } | { type: 'code', lang, code }
 */
export function buildContentBlocks(text, probability = 0.55) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const blocks = [];

  const pushProse = (str) => {
    if (str.trim()) blocks.push({ type: 'prose', text: str });
  };
  const pushCode = () => {
    const { lang, code } = randomNoiseBlock();
    blocks.push({ type: 'code', lang, code });
  };

  paragraphs.forEach((para, pi) => {
    const sentences = splitSentences(para);
    let buffer = '';
    let sinceBreak = 0;
    const threshold = rand(2, 4);

    sentences.forEach((s, si) => {
      buffer += s;
      sinceBreak++;
      const isLast = si === sentences.length - 1;
      if (!isLast && sinceBreak >= threshold && Math.random() < probability) {
        pushProse(buffer);
        pushCode();
        buffer = '';
        sinceBreak = 0;
      }
    });
    pushProse(buffer);

    if (pi < paragraphs.length - 1 && Math.random() < probability) {
      pushCode();
    }
  });

  return blocks;
}
