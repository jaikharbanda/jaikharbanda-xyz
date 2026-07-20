import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.jaikharbanda.xyz',
  trailingSlash: 'never',
  build: { format: 'file' },
});
