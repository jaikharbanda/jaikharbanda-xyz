// Refreshes src/data/substack-posts.js: the copy of the Substack post list that the site falls
// back on when a build can reach neither the feed nor the relay (see src/lib/substack.js).
// Run it from a laptop, because Substack blocks GitHub's build machines but not home connections:
//   node scripts/save-substack-posts.mjs
import { writeFile } from 'node:fs/promises';
import { getFeedPosts } from '../src/lib/substack.js';

const posts = await getFeedPosts();
if (!posts.length) throw new Error('The feed returned no posts, so the saved copy was left as it was.');

const data = {
  savedAt: new Date().toISOString().slice(0, 10),
  posts: posts.map((p) => ({
    title: p.title,
    link: p.link,
    date: p.date.toISOString(),
    description: p.description,
  })),
};
const header = '// The saved copy of the Substack post list. The site shows it only when a build can reach\n'
  + '// neither the feed nor the relay. Refresh it with: node scripts/save-substack-posts.mjs\n';
await writeFile(
  new URL('../src/data/substack-posts.js', import.meta.url),
  `${header}export default ${JSON.stringify(data, null, 2)};\n`,
);
console.log(`Saved ${data.posts.length} posts (newest: ${data.posts[0].title}).`);
