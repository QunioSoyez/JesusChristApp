// Collects the licenses of the app's runtime npm packages into src/data/licenses.json, shown on
// the About & Credits screen ("Open-source licenses"). Re-run after adding or updating packages:
//
//   npm run build-licenses
//
// Reads package-lock.json (non-dev packages only) and each installed package's package.json and
// LICENSE file. Identical license texts are stored once and referenced by index to keep it small.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt|markdown))?$|^licen[cs]e[-.]mit(\.(md|txt))?$/i;

const licenseName = (pkg) => {
  const l = pkg.license ?? pkg.licenses;
  if (!l) return 'Unknown';
  if (typeof l === 'string') return l;
  if (Array.isArray(l)) return l.map((x) => x.type ?? x).join(' OR ');
  return l.type ?? 'Unknown';
};

const repoUrl = (pkg) => {
  let r = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  if (!r) return pkg.homepage;
  r = r.replace(/^git\+/, '').replace(/\.git$/, '').replace(/^git:\/\//, 'https://');
  if (/^[\w-]+\/[\w.-]+$/.test(r)) r = `https://github.com/${r}`; // "owner/repo" shorthand
  if (r.startsWith('github:')) r = `https://github.com/${r.slice(7)}`;
  return r.replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/');
};

const texts = [];
const textIndex = new Map();
const packages = [];
const seen = new Set();

for (const [key, entry] of Object.entries(lock.packages ?? {})) {
  if (!key || entry.dev) continue; // "" is this app itself
  const dir = path.join(root, key);
  const pkgFile = path.join(dir, 'package.json');
  if (!fs.existsSync(pkgFile)) continue; // optional package for another platform
  const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
  const id = `${pkg.name}@${pkg.version}`;
  if (seen.has(id)) continue;
  seen.add(id);

  const file = fs.readdirSync(dir).find((f) => LICENSE_FILE.test(f));
  let t = -1;
  if (file) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n').trim();
    if (!textIndex.has(text)) {
      textIndex.set(text, texts.length);
      texts.push(text);
    }
    t = textIndex.get(text);
  }
  packages.push({ n: pkg.name, v: pkg.version, l: licenseName(pkg), r: repoUrl(pkg), t });
}

packages.sort((a, b) => a.n.localeCompare(b.n));
const out = { generated: new Date().toISOString().slice(0, 10), packages, texts };
fs.writeFileSync(path.join(root, 'src', 'data', 'licenses.json'), JSON.stringify(out));

const missing = packages.filter((p) => p.t < 0).length;
console.log(`${packages.length} packages, ${texts.length} distinct license texts, ${missing} without a license file.`);
