import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const projectRoot = process.cwd();
const htmlPath = resolve(projectRoot, 'dist/index.html');
const serverEntryPath = resolve(projectRoot, 'dist-server/entry-server.js');
const { render } = await import(pathToFileURL(serverEntryPath).href);
const { html, styleTags } = render();

if (!html.includes('Hẹn gặp bạn nhé!') || !html.includes('Chuyện chúng mình')) {
  throw new Error('Prerendered HTML is missing wedding content.');
}

let document = await readFile(htmlPath, 'utf8');
const rootPlaceholder = '<div id="root"></div>';

if (!document.includes(rootPlaceholder)) {
  throw new Error('Could not find the HTML root placeholder.');
}

document = document.replace(
  rootPlaceholder,
  `<div id="root">${html}</div>`,
);
document = document.replace('</head>', `${styleTags}\n  </head>`);

await writeFile(htmlPath, document);
