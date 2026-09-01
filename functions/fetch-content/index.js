const functions = require('@google-cloud/functions-framework');
const cheerio = require('cheerio');

const ALLOWED_ORIGINS = new Set([
  'https://ww22855ww.github.io',
  'http://localhost:5173',
]);

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

functions.http('fetchContent', async (req, res) => {
  const origin = req.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== 'string') {
    res.status(400).json({ error: '缺少 url 參數' });
    return;
  }

  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch {
    res.status(400).json({ error: '網址格式錯誤' });
    return;
  }

  try {
    if (/(^|\.)ptt\.cc$/.test(parsed.hostname)) {
      res.status(200).json(await fetchPtt(targetUrl));
    } else if (/(^|\.)reddit\.com$/.test(parsed.hostname)) {
      res.status(400).json({ error: 'Reddit 會擋自動抓取，請手動複製貼上文字內容' });
    } else {
      res.status(400).json({ error: '目前只支援 PTT 網址' });
    }
  } catch (err) {
    res.status(502).json({ error: `抓取失敗：${err.message}` });
  }
});

async function fetchPtt(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Cookie: 'over18=1',
    },
  });
  if (!resp.ok) throw new Error(`PTT 回應 ${resp.status}`);
  const html = await resp.text();

  const $ = cheerio.load(html);
  let title = '';
  $('.article-metaline').each((_, el) => {
    if ($(el).find('.article-meta-tag').text().trim() === '標題') {
      title = $(el).find('.article-meta-value').text().trim();
    }
  });
  if (!title) title = $('title').text().trim();

  const main = $('#main-content');
  main.find('.article-metaline, .article-metaline-right, .push').remove();
  main.find('br').replaceWith('\n');

  const content = main
    .text()
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { source: 'ptt', title, content };
}
