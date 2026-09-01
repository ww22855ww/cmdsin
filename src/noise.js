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
];

function randomNoiseBlock() {
  return Math.random() < 0.55 ? pick(SINGLE_LINES)() : pick(MULTI_LINES)().join('\n');
}

/**
 * Splits paragraph-separated text and randomly inserts fake code/log
 * snippets between paragraphs, so the plain text reads less obviously
 * like prose to someone glancing at the screen.
 */
export function interleaveNoise(text, probability = 0.3) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const pieces = [];
  paragraphs.forEach((p, i) => {
    pieces.push(p);
    if (i < paragraphs.length - 1 && Math.random() < probability) {
      pieces.push(randomNoiseBlock());
    }
  });
  return pieces.join('\n\n');
}
