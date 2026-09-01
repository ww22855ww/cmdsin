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

const SINGLE_LINES = [
  () => `[DEBUG] cache miss for key user:${rand(1000, 9999)}, refetching...`,
  () => `console.log('checkpoint ${pick('ABCDEFGH')}' , state.length)`,
  () => `// TODO: refactor this before it breaks in prod`,
  () => `assert dataset.shape == (${rand(32, 256)}, ${rand(16, 128)})  # sanity check`,
  () => `worker-${rand(1, 6)}: task #${rand(1000, 9999)} ack`,
  () => `>>> len(results)`,
  () => `${rand(100, 999)}`,
  () => `[WARN] deprecated API call: db.find() → use db.findOne()`,
  () => `req.headers['x-request-id'] = '${hash(12)}'`,
  () => `# NOTE: revert this once the upstream fix ships`,
  () => `retrying in ${(Math.random() * 3 + 0.5).toFixed(1)}s (attempt ${rand(1, 4)}/5)`,
  () => `const config = require('./config/${pick(['dev', 'staging', 'prod'])}.json');`,
  () => `[INFO] flushing write buffer (${rand(1, 64)}KB)`,
  () => `expect(response.status).toBe(${pick([200, 201, 204])});`,
  () => `# checksum: ${hash(32)}`,
];

const MULTI_LINES = [
  () => [
    'Traceback (most recent call last):',
    `  File "main.py", line ${rand(20, 400)}, in <module>`,
    'IndexError: list index out of range',
  ],
  () => [
    "TypeError: Cannot read properties of undefined (reading 'map')",
    '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
  ],
  () => [
    '+ git commit -m "wip: fix edge case"',
    `[main ${hash(7)}] wip: fix edge case`,
    ` 1 file changed, ${rand(1, 20)} insertions(+), ${rand(0, 5)} deletions(-)`,
  ],
  () => [
    `SELECT * FROM sessions WHERE user_id = ${rand(1000, 9999)};`,
    `-- ${rand(1, 40)} rows in set (${(Math.random() * 0.2).toFixed(3)} sec)`,
  ],
  () => [
    `def handle(event):`,
    `    payload = json.loads(event["body"])`,
    `    return {"statusCode": 200, "body": json.dumps(payload)}`,
  ],
  () => [
    `function debounce(fn, wait) {`,
    `  let t;`,
    `  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };`,
    `}`,
  ],
  () => [
    `curl -s -X POST https://api.internal/v2/jobs \\`,
    `  -H "Authorization: Bearer ${hash(24)}" \\`,
    `  -d '{"priority":"${pick(['low', 'normal', 'high'])}"}'`,
  ],
  () => [
    `class Cache:`,
    `    def __init__(self, ttl=${rand(30, 600)}):`,
    `        self._store = {}`,
    `        self.ttl = ttl`,
  ],
  () => [
    `WARNING: pool exhausted, spawning ${rand(1, 4)} extra worker(s)`,
    `worker-${rand(5, 9)}: spawned, pid ${rand(1000, 32000)}`,
  ],
];

function randomNoiseBlock() {
  const useMulti = Math.random() < 0.6;
  const block = useMulti ? pick(MULTI_LINES)().join('\n') : pick(SINGLE_LINES)();
  if (Math.random() < 0.25) {
    const second = Math.random() < 0.5 ? pick(SINGLE_LINES)() : pick(MULTI_LINES)().join('\n');
    return `${block}\n${second}`;
  }
  return block;
}

function splitSentences(paragraph) {
  return paragraph.split(/(?<=[。！？.!?])/).filter((s) => s.trim().length > 0);
}

/**
 * Breaks article text into short sentence clusters and randomly interleaves
 * fake code/log snippets both between paragraphs and mid-paragraph, so long
 * blocks of prose don't stay clumped together — the goal is for a passerby's
 * glance to land on something that looks like code/log output more often
 * than not.
 */
export function interleaveNoise(text, probability = 0.55) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const out = [];

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
        out.push(buffer);
        out.push(randomNoiseBlock());
        buffer = '';
        sinceBreak = 0;
      }
    });
    if (buffer) out.push(buffer);

    if (pi < paragraphs.length - 1 && Math.random() < probability) {
      out.push(randomNoiseBlock());
    }
  });

  return out.join('\n\n');
}
