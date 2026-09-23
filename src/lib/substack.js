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

// Every outcome is written to the build log. This used to fail silently, so the live site
// said "The feed didn't load this time" while nothing anywhere said why.
export async function getPosts(limit = 20) {
  try {
    const res = await fetch(FEED);
    if (!res.ok) {
      const body = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120);
      console.warn(`substack: feed refused, HTTP ${res.status} (server=${res.headers.get('server') ?? '?'}, cf-mitigated=${res.headers.get('cf-mitigated') ?? 'none'}): ${body}`);
      return [];
    }
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    const posts = items
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
    const start = posts.length ? '' : ` (feed starts: ${xml.replace(/\s+/g, ' ').slice(0, 120)})`;
    console.log(`substack: loaded ${posts.length} posts${start}`);
    return posts;
  } catch (err) {
    console.warn(`substack: feed request failed: ${err?.cause?.code ?? err?.cause?.message ?? err?.message ?? err}`);
    return [];
  }
}

export function ukDate(d) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}
