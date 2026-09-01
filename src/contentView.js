import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('plaintext', plaintext);

const LANG_LABEL = {
  javascript: 'JavaScript',
  python: 'Python',
  sql: 'SQL',
  bash: 'shell',
  plaintext: 'log',
};

/**
 * Renders structured content blocks (see noise.js#buildContentBlocks)
 * into `container` as read-only HTML: prose blocks as plain text, code
 * blocks as syntax-highlighted panes with a small IDE-style header.
 */
export function renderContentBlocks(container, title, blocks) {
  container.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'prose-block prose-title';
  heading.textContent = `# ${title}`;
  container.appendChild(heading);

  blocks.forEach((block) => {
    if (block.type === 'prose') {
      const div = document.createElement('div');
      div.className = 'prose-block';
      div.textContent = block.text;
      container.appendChild(div);
      return;
    }

    if (block.type === 'caption') {
      const div = document.createElement('div');
      div.className = 'prose-block prose-caption';
      div.textContent = block.text;
      container.appendChild(div);
      return;
    }

    if (block.type === 'hr') {
      container.appendChild(document.createElement('hr')).className = 'content-divider';
      return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'code-block';

    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.textContent = LANG_LABEL[block.lang] || block.lang;
    wrap.appendChild(header);

    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = `hljs language-${block.lang}`;
    const { value } = hljs.highlight(block.code, { language: block.lang });
    code.innerHTML = value;
    pre.appendChild(code);
    wrap.appendChild(pre);

    container.appendChild(wrap);
  });
}
