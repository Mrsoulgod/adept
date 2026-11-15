import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('dist');
const dest = path.resolve('docs');

if (fs.existsSync(src)) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log('✓ Successfully synchronized dist/ to docs/ for GitHub Pages');
}
