const functions = require('@google-cloud/functions-framework');
const cheerio = require('cheerio');

const ALLOWED_ORIGINS = new Set([
  'https://ww22855ww.github.io',
  'http://localhost:5173',
]);

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const PTT_ARTICLE_RE = /^\/bbs\/([^/]+)\/M\.\d+\.A\.[0-9A-F]+\.html$/i;
const PTT_BOARD_RE = /^\/bbs\/([^/]+)\/(?:index(\d+)?\.html)?$/i;
const PTT_MAN_ARTICLE_RE = /^\/man\/([^/]+)\/(?:[0-9A-F]+\/)*M\.\d+\.A\.[0-9A-F]+\.html$/i;
const PTT_MAN_INDEX_RE = /^\/man\/([^/]+)\/(?:[0-9A-F]+\/)*index\.html$/i;

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
      if (PTT_ARTICLE_RE.test(parsed.pathname) || PTT_MAN_ARTICLE_RE.test(parsed.pathname)) {
        res.status(200).json(await fetchPttArticle(targetUrl));
      } else if (PTT_BOARD_RE.test(parsed.pathname)) {
        res.status(200).json(await fetchPttBoard(targetUrl));
      } else if (PTT_MAN_INDEX_RE.test(parsed.pathname)) {
        res.status(200).json(await fetchPttManIndex(targetUrl));
      } else {
        res.status(400).json({ error: '無法識別的 PTT 網址格式' });
      }
    } else if (/(^|\.)reddit\.com$/.test(parsed.hostname)) {
      res.status(400).json({ error: 'Reddit 會擋自動抓取，請手動複製貼上文字內容' });
    } else {
      res.status(400).json({ error: '目前只支援 PTT 網址' });
    }
  } catch (err) {
    res.status(502).json({ error: `抓取失敗：${err.message}` });
  }
});

async function fetchPttHtml(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': BROWSER_UA,
      Cookie: 'over18=1',
    },
  });
  if (!resp.ok) throw new Error(`PTT 回應 ${resp.status}`);
  return resp.text();
}

async function fetchPttArticle(url) {
  const html = await fetchPttHtml(url);
  const $ = cheerio.load(html);

  let title = '';
  $('.article-metaline').each((_, el) => {
    if ($(el).find('.article-meta-tag').text().trim() === '標題') {
      title = $(el).find('.article-meta-value').text().trim();
    }
  });
  if (!title) title = $('title').text().trim();

  const main = $('#main-content');

  const pushLines = [];
  main.find('.push').each((_, el) => {
    const tag = $(el).find('.push-tag').text().trim();
    const userid = $(el).find('.push-userid').text().trim();
    const text = $(el).find('.push-content').text().replace(/^:\s*/, '').trim();
    const time = $(el).find('.push-ipdatetime').text().trim();
    if (userid) pushLines.push(`${tag} ${userid}: ${text} ${time}`.trim());
  });

  main.find('.article-metaline, .article-metaline-right, .push').remove();
  main.find('br').replaceWith('\n');

  const body = main
    .text()
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const content = pushLines.length
    ? `${body}\n\n===== 留言 (${pushLines.length}) =====\n\n${pushLines.join('\n')}`
    : body;

  return { type: 'article', source: 'ptt', title, content };
}

async function fetchPttBoard(url) {
  const html = await fetchPttHtml(url);
  const $ = cheerio.load(html);
  const parsed = new URL(url);
  const boardMatch = parsed.pathname.match(PTT_BOARD_RE);
  const board = boardMatch[1];
  const page = boardMatch[2] ? Number(boardMatch[2]) : null;

  const items = [];
  $('.r-ent').each((_, el) => {
    const link = $(el).find('.title a');
    if (!link.length) return; // deleted article, no link
    const href = new URL(link.attr('href'), url).toString();
    const title = link.text().trim();
    const author = $(el).find('.meta .author').text().trim();
    const date = $(el).find('.meta .date').text().trim();
    const pushText = $(el).find('.nrec').text().trim();
    items.push({ title, author, date, url: href, push: pushText });
  });

  const pagingLinks = $('.action-bar .btn-group-paging a.btn');
  const prevHref = pagingLinks.eq(1).attr('href');
  const nextHref = pagingLinks.eq(2).attr('href');
  const manHref = $('.action-bar .btn-group-dir a.btn').eq(1).attr('href');

  return {
    type: 'list',
    source: 'ptt',
    kind: 'board',
    board,
    page,
    sourceUrl: url,
    items,
    prevUrl: prevHref ? new URL(prevHref, url).toString() : null,
    nextUrl: nextHref ? new URL(nextHref, url).toString() : null,
    manUrl: manHref ? new URL(manHref, url).toString() : null,
  };
}

async function fetchPttManIndex(url) {
  const html = await fetchPttHtml(url);
  const $ = cheerio.load(html);
  const parsed = new URL(url);
  const boardMatch = parsed.pathname.match(PTT_MAN_INDEX_RE);
  const board = boardMatch[1];

  const items = [];
  $('.m-ent .title a').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const absUrl = new URL(href, url).toString();
    const title = $(el).text().trim();
    const isFolder = /\/index\.html$/i.test(new URL(absUrl).pathname);
    items.push({ title, url: absUrl, isFolder });
  });

  const boardHref = $('.action-bar .btn-group-dir a.btn').first().attr('href');
  const boardUrl = boardHref ? new URL(boardHref, url).toString() : null;

  const parentHref = $('#navigation a.board').attr('href');
  const parentUrl = parentHref ? new URL(parentHref, url).toString() : null;
  const isRoot = parentUrl === new URL(url).toString();

  return {
    type: 'list',
    source: 'ptt',
    kind: 'man',
    board,
    sourceUrl: url,
    items,
    boardUrl,
    parentUrl: isRoot ? null : parentUrl,
  };
}
