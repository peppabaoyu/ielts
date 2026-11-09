// build-notes.mjs — 从 ielts-vocab-data.md / ielts-synonyms.md 生成 notes.html
// 每晚同步任务自动运行；也可手动执行：node build-notes.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const cells = line => line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(c => c.trim());
const isSep = cs => cs.every(c => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));

// ---------- 解析生词本 ----------
function parseVocab(md) {
  const lines = md.split(/\r?\n/);
  const intro = [];
  const sections = [];
  let sec = null, mode = null, rows = [];
  const flushRows = () => {
    if (sec && rows.length && mode === 'words') {
      const hdr = cells(rows[0]);
      sec.words = rows.slice(1).filter(r => !isSep(cells(r))).map(cells);
      sec.wordHeaders = hdr;
    }
    rows = [];
  };
  for (const line of lines) {
    if (line.startsWith('## ')) {
      flushRows();
      sec = { title: line.slice(3).trim(), words: [], wordHeaders: [], sentences: [] };
      sections.push(sec); mode = null; continue;
    }
    if (!sec) { if (line.trim()) intro.push(line); continue; }
    if (line.startsWith('#### ')) { flushRows(); mode = line.slice(5).trim() === '生词' ? 'words' : (line.slice(5).trim() === '长难句' ? 'sent' : null); continue; }
    if (mode === 'words' && line.startsWith('|')) { rows.push(line); continue; }
    if (mode === 'sent') {
      const t = line.trim();
      if (t === '（暂无）') continue;
      if (line.startsWith('- ')) sec.sentences.push({ main: line.slice(2), subs: [] });
      else if (/^\s+- /.test(line) && sec.sentences.length) sec.sentences.at(-1).subs.push(line.trim().slice(2));
      continue;
    }
    flushRows();
  }
  flushRows();
  return { intro, sections };
}

// ---------- 解析同义替换 ----------
function parseSyn(md) {
  const lines = md.split(/\r?\n/);
  const intro = [];
  const blocks = [];
  let blk = null, rows = [];
  const flush = () => {
    if (blk && rows.length) {
      blk.headers = cells(rows[0]);
      blk.rows = rows.slice(1).filter(r => !isSep(cells(r))).map(cells);
    }
    rows = [];
  };
  for (const line of lines) {
    if (line.startsWith('## ') || line.startsWith('### ')) {
      flush();
      blk = { level: line.startsWith('### ') ? 3 : 2, title: line.replace(/^#+\s*/, '').trim(), note: [], headers: [], rows: [] };
      blocks.push(blk); continue;
    }
    if (!blk) { if (line.trim()) intro.push(line); continue; }
    if (line.startsWith('>')) { blk.note.push(line.replace(/^>\s?/, '')); continue; }
    if (line.startsWith('|')) { rows.push(line); continue; }
    if (line.trim()) flush();
  }
  flush();
  return { intro, blocks };
}

// ---------- 渲染 ----------
const table = (headers, rows) => {
  const hfRow = r => r.some(c => c.includes('⭐')) ? ' class="hf"' : '';
  return `<div class="tw"><table><thead><tr>${headers.map(h => `<th>${inline(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr${hfRow(r)} data-s>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('\n')}</tbody></table></div>`;
};

const vocab = parseVocab(readFileSync('ielts-vocab-data.md', 'utf8'));
const syn = parseSyn(readFileSync('ielts-synonyms.md', 'utf8'));
const slug = t => 'sec-' + t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const chips = vocab.sections.map(s => `<a class="chip" href="#${slug(s.title)}">${esc(s.title.split('（')[0])}</a>`).join('');
const vocabHtml = vocab.sections.map(s => {
  const w = s.words.length ? table(s.wordHeaders, s.words) : '';
  const sent = s.sentences.length ? `<div class="cards">` + s.sentences.map(c => `
<div class="card" data-s><p class="orig">${inline(c.main)}</p>${c.subs.map(t => {
    const m = t.match(/^\*\*(.+?)\*\*：(.*)$/);
    return m ? `<p class="sub"><span class="lab">${esc(m[1])}</span>${inline(m[2])}</p>` : `<p class="sub">${inline(t)}</p>`;
  }).join('')}</div>`).join('') + `</div>` : '';
  return `<section id="${slug(s.title)}" class="sec" data-s><h2>${inline(s.title)}</h2>${w}${sent}</section>`;
}).join('\n');

const synHtml = syn.blocks.map(b => {
  const h = b.level === 3 ? 'h3' : 'h2';
  const note = b.note.length ? `<div class="note">${b.note.map(n => `<p>${inline(n)}</p>`).join('')}</div>` : '';
  const tbl = b.rows.length ? table(b.headers, b.rows) : '';
  return `<section class="sec" data-s><${h}>${inline(b.title)}</${h}>${note}${tbl}</section>`;
}).join('\n');

const introBox = arr => arr.length ? `<div class="note">${arr.map(l => `<p>${inline(l.replace(/^>\s?/, '').replace(/^#\s*/, ''))}</p>`).join('')}</div>` : '';

const stamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>IELTS 学习笔记</title>
<style>
:root{--bg:#f6f7fa;--card:#fff;--ink:#1c2333;--mut:#6b7280;--acc:#2563eb;--hf:#fff8e6;--line:#e5e8ef}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.7 -apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}
header{position:sticky;top:0;z-index:9;background:var(--card);border-bottom:1px solid var(--line);padding:10px 14px}
h1{font-size:17px;margin:0 0 8px;display:flex;justify-content:space-between;align-items:center}
.tabs{display:flex;gap:6px}.tab{padding:5px 14px;border:1px solid var(--line);border-radius:99px;background:#fff;cursor:pointer;font-size:14px}
.tab.on{background:var(--acc);color:#fff;border-color:var(--acc)}
#q{width:100%;padding:8px 12px;border:1px solid var(--line);border-radius:10px;font-size:15px;margin-top:8px}
main{max-width:960px;margin:0 auto;padding:14px}
.chips{display:flex;gap:6px;overflow-x:auto;padding:4px 0 10px;scrollbar-width:none}
.chip{white-space:nowrap;font-size:13px;color:var(--acc);background:#eef3fe;border-radius:99px;padding:4px 10px;text-decoration:none}
.sec{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:14px 0;scroll-margin-top:120px}
h2{font-size:16px;margin:0 0 10px}h3{font-size:15px;margin:18px 0 8px}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:13.5px}
th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
th{background:#f0f3f9;white-space:nowrap}tbody tr:nth-child(even){background:#fafbfd}
tr.hf{background:var(--hf)}tr.hf td:first-child{border-left:3px solid #f59e0b}
.cards{display:flex;flex-direction:column;gap:10px;margin-top:10px}
.card{border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:#fbfcfe}
.orig{margin:0 0 6px;font-weight:600}.sub{margin:3px 0;color:#3b4354}
.lab{display:inline-block;background:#eef3fe;color:var(--acc);border-radius:6px;padding:0 8px;margin-right:8px;font-size:12.5px;font-weight:600}
.note{background:#eef3fe;border-radius:10px;padding:10px 14px;font-size:13.5px;color:#41506e}.note p{margin:4px 0}
footer{text-align:center;color:var(--mut);font-size:12px;padding:20px}
[data-s][hidden]{display:none}
@media(max-width:600px){body{font-size:14px}table{font-size:12.5px}.sec{padding:12px}}
</style></head><body>
<header><h1>IELTS 学习笔记<span style="font-size:12px;color:var(--mut)">peppabaoyu/ielts</span></h1>
<div class="tabs"><button class="tab on" data-t="v">生词本</button><button class="tab" data-t="s">同义替换</button></div>
<input id="q" type="search" placeholder="搜索单词、释义、替换组……"></header>
<main><div id="v">${introBox(vocab.intro)}<nav class="chips">${chips}</nav>${vocabHtml}</div>
<div id="s" hidden>${introBox(syn.intro)}${synHtml}</div></main>
<footer>本页由 build-notes.mjs 自动生成 · 更新于 ${esc(stamp)} · 每晚 12:00 随笔记同步更新</footer>
<script>
const q=document.getElementById('q');
q.addEventListener('input',()=>{const k=q.value.trim().toLowerCase();
for(const it of document.querySelectorAll('[data-s]')){
 if(it.tagName==='SECTION'){let any=false;for(const ch of it.querySelectorAll('tr[data-s],.card')){const show=!k||ch.textContent.toLowerCase().includes(k);ch.hidden=!show;any=any||show}it.hidden=k&&!any}
 else{it.hidden=k&&!it.textContent.toLowerCase().includes(k)}}});
for(const b of document.querySelectorAll('.tab'))b.addEventListener('click',()=>{
 document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('on',x===b));
 document.getElementById('v').hidden=b.dataset.t!=='v';document.getElementById('s').hidden=b.dataset.t!=='s'});
</script></body></html>`;

writeFileSync('notes.html', html);
console.log(`notes.html 生成完成：生词 ${vocab.sections.length} 个章节 / 同义替换 ${syn.blocks.length} 个板块，共 ${html.length} 字符`);
