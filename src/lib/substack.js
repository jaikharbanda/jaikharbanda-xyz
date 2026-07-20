const FEED = 'https://jaikharbanda.substack.com/feed';

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

export async function getPosts(limit = 20) {
  try {
    const res = await fetch(FEED);
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    return items
      .map((i) => {
        const title = clean(field(i, 'title'));
        const description = clean(field(i, 'description'));
        return {
          title,
          link: clean(field(i, 'link')),
          date: new Date(clean(field(i, 'pubDate'))),
          description: description === title ? '' : description,
        };
      })
      .filter((p) => p.title && p.link)
      .slice(0, limit);
  } catch {
    return [];
  }
}

export function ukDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
