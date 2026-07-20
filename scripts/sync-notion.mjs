// Pulls site copy from Notion into the repo before each build.
// Fail-soft: without NOTION_TOKEN, or on any API error, the committed
// content stays as-is and the build proceeds.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'site.notion.json'), 'utf8'));
const TOKEN = process.env.NOTION_TOKEN;

if (!TOKEN) {
  console.log('sync-notion: NOTION_TOKEN not set, keeping committed content.');
  process.exit(0);
}

const API = 'https://api.notion.com/v1';
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, { headers: HEADERS, ...options });
  if (!res.ok) throw new Error(`Notion ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function queryDatabase(id) {
  const results = [];
  let cursor;
  do {
    const body = cursor ? JSON.stringify({ start_cursor: cursor }) : '{}';
    const page = await api(`/databases/${id}/query`, { method: 'POST', body });
    results.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return results;
}

async function listBlocks(id) {
  const blocks = [];
  let cursor;
  do {
    const qs = cursor ? `?start_cursor=${cursor}&page_size=100` : '?page_size=100';
    const page = await api(`/blocks/${id}/children${qs}`);
    blocks.push(...page.results);
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

function richText(arr = []) {
  return arr
    .map((t) => {
      let s = t.plain_text || '';
      const a = t.annotations || {};
      if (a.code) s = `\`${s}\``;
      if (a.bold) s = `**${s}**`;
      if (a.italic) s = `*${s}*`;
      if (t.href) s = `[${s}](${t.href})`;
      return s;
    })
    .join('');
}

function blocksToMarkdown(blocks) {
  const out = [];
  for (const b of blocks) {
    const t = b.type;
    const rt = (b[t] && b[t].rich_text) || [];
    if (t === 'paragraph') out.push(richText(rt) + '\n');
    else if (t === 'heading_1') out.push(`# ${richText(rt)}\n`);
    else if (t === 'heading_2') out.push(`## ${richText(rt)}\n`);
    else if (t === 'heading_3') out.push(`### ${richText(rt)}\n`);
    else if (t === 'bulleted_list_item') out.push(`- ${richText(rt)}`);
    else if (t === 'numbered_list_item') out.push(`1. ${richText(rt)}`);
    else if (t === 'quote') out.push(`> ${richText(rt)}\n`);
    else if (t === 'divider') out.push('---\n');
    // Unsupported block types are skipped on purpose.
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function prop(page, name) {
  const p = page.properties[name];
  if (!p) return '';
  if (p.type === 'title') return p.title.map((t) => t.plain_text).join('');
  if (p.type === 'rich_text') return p.rich_text.map((t) => t.plain_text).join('');
  if (p.type === 'checkbox') return p.checkbox;
  if (p.type === 'date') return p.date ? p.date.start : '';
  if (p.type === 'multi_select') return p.multi_select.map((o) => o.name);
  return '';
}

function yamlString(s) {
  return JSON.stringify(String(s));
}

function kebab(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// 1. Case studies -> src/content/work/*.md
const workDir = join(ROOT, 'src/content/work');
const rows = await queryDatabase(CONFIG.caseStudiesDatabase);
const published = rows.filter((r) => prop(r, 'Published') === true);
if (published.length === 0) {
  throw new Error('No published case studies returned; refusing to wipe content.');
}
const files = [];
for (const row of published) {
  const title = prop(row, 'Name');
  const slug = kebab(prop(row, 'Slug') || title);
  const pillars = prop(row, 'Pillars');
  const date = prop(row, 'Date') || '2026-01-01';
  const summary = prop(row, 'Summary');
  const note = prop(row, 'Note');
  const featured = prop(row, 'Featured') === true;
  const artifacts = String(prop(row, 'Artifacts') || '')
    .split('\n')
    .map((l) => l.split('|').map((s) => s.trim()))
    .filter((p) => p.length === 2 && p[0] && p[1].startsWith('http'))
    .map(([label, url]) => ({ label, url }));

  const body = blocksToMarkdown(await listBlocks(row.id));
  const fm = [
    '---',
    `title: ${yamlString(title)}`,
    `pillars: [${pillars.join(', ')}]`,
    `date: ${date}`,
    `summary: ${yamlString(summary)}`,
    `featured: ${featured}`,
  ];
  if (artifacts.length) {
    fm.push('artifacts:');
    for (const a of artifacts) fm.push(`  - label: ${yamlString(a.label)}\n    url: ${yamlString(a.url)}`);
  }
  if (note) fm.push(`note: ${yamlString(note)}`);
  fm.push('---');
  files.push({ name: `${slug}.md`, content: `${fm.join('\n')}\n${body}` });
}
mkdirSync(workDir, { recursive: true });
for (const f of readdirSync(workDir)) if (f.endsWith('.md')) unlinkSync(join(workDir, f));
for (const f of files) writeFileSync(join(workDir, f.name), f.content);
console.log(`sync-notion: wrote ${files.length} case studies.`);

// 2. Site copy -> src/data/copy.json
const copyRows = await queryDatabase(CONFIG.siteCopyDatabase);
const copy = {};
for (const row of copyRows) {
  const key = prop(row, 'Key').trim();
  if (key) copy[key] = prop(row, 'Text').trim();
}
mkdirSync(join(ROOT, 'src/data'), { recursive: true });
writeFileSync(join(ROOT, 'src/data/copy.json'), JSON.stringify(copy, null, 2) + '\n');
console.log(`sync-notion: wrote ${Object.keys(copy).length} copy strings.`);

// 3. Sections -> src/content/sections/*.md
const sectionsDir = join(ROOT, 'src/content/sections');
mkdirSync(sectionsDir, { recursive: true });
for (const [name, pageId] of Object.entries(CONFIG.sections)) {
  const md = blocksToMarkdown(await listBlocks(pageId));
  writeFileSync(join(sectionsDir, `${name}.md`), `---\nname: ${yamlString(name)}\n---\n${md}`);
  console.log(`sync-notion: wrote section ${name}.`);
}
