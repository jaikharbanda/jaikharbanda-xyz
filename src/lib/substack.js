import saved from '../data/substack-posts.js';

const FEED = 'https://jaikharbanda.substack.com/feed';

// Substack's Cloudflare shows GitHub's build machines a "Just a moment..." robot check
// (HTTP 403, cf-mitigated=challenge, proven 23 Sep 2026) while it lets laptops and other
// clouds through. So a build tries three sources in order: the feed itself, a free relay
// that fetches the feed from its own servers, then the copy saved in src/data.
const RELAY = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED)}`;
const TIMEOUT_MS = 15000;

function field(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? m[1].trim() : '';
}

function clean(s) {
  return s
    .replace(/^<!\[CDATA\[/, '')
    .replace(/\]\]>$/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function tidy(post) {
  const title = clean(String(post.title ?? ''));
  const description = clean(String(post.description ?? ''));
  return {
    title,
    link: clean(String(post.link ?? '')),
    date: new Date(post.date),
    description: description === title ? '' : description,
  };
}

async function fromFeed() {
  const res = await fetch(FEED, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) {
    const body = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120);
    throw new Error(`HTTP ${res.status} (server=${res.headers.get('server') ?? '?'}, cf-mitigated=${res.headers.get('cf-mitigated') ?? 'none'}): ${body}`);
  }
  const xml = await res.text();
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => ({
    title: field(item, 'title'),
    link: field(item, 'link'),
    date: clean(field(item, 'pubDate')),
    description: field(item, 'description'),
  }));
}

async function fromRelay() {
  const res = await fetch(RELAY, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || `status ${data.status}`);
  // The relay gives dates as "YYYY-MM-DD HH:MM:SS" in UTC.
  return (data.items ?? []).map((i) => ({
    title: i.title,
    link: i.link,
    date: `${String(i.pubDate).replace(' ', 'T')}Z`,
    description: i.description,
  }));
}

const SOURCES = [
  ['the Substack feed', fromFeed],
  ['the rss2json relay', fromRelay],
  [`the saved copy from ${saved.savedAt}`, async () => saved.posts],
];

async function loadPosts() {
  for (const [name, load] of SOURCES) {
    try {
      const posts = (await load())
        .map(tidy)
        .filter((p) => p.title && p.link && !Number.isNaN(p.date.valueOf()));
      if (posts.length) {
        console.log(`substack: loaded ${posts.length} posts from ${name}`);
        return posts;
      }
      console.warn(`substack: ${name} returned no posts`);
    } catch (err) {
      console.warn(`substack: ${name} failed: ${err?.cause?.code ?? err?.message ?? err}`);
    }
  }
  return [];
}

// The feed itself, parsed and tidied. Used by scripts/save-substack-posts.mjs.
export async function getFeedPosts() {
  return (await fromFeed()).map(tidy).filter((p) => p.title && p.link);
}

// One load per build, shared by every page that lists posts.
let loading;
export async function getPosts(limit = 20) {
  loading ??= loadPosts();
  return (await loading).slice(0, limit);
}

export function ukDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
