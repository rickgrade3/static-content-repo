const fs = require('fs');
const path = require('path');

const baseDir = __dirname;
const outDir = path.join(baseDir, 'popular-pin-links');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

// Map: filename (without .json) -> field to use as label/query
const standaloneFiles = [
  { file: 'popular-celeberty.json',          field: 'title' },
  { file: 'popular-country.json',            field: 'country' },
  { file: 'popular-dev-framework.json',      field: 'title' },
  { file: 'popular-dog-breed.json',          field: 'title' },
  { file: 'popular-god.json',                field: 'title' },
  { file: 'popular-historical-event.json',   field: 'title' },
  { file: 'popular-historical-person.json',  field: 'title' },
  { file: 'popular-horror-event.json',       field: 'title' },
  { file: 'popular-horror-place.json',       field: 'title' },
  { file: 'popular-murderer-cases.json',     field: 'title' },
  { file: 'popular-myth.json',               field: 'title' },
  { file: 'popular-pokemon.json',            field: 'title' },
  { file: 'popular-programming-software.json', field: 'title' },
  { file: 'popular-unusual-event.json',      field: 'title' },
];

// Subdirectory configs: dir -> { prefix, field }
const subDirConfigs = [
  { dir: 'popular-anime',  prefix: 'popular-anime-character-', field: 'title' },
  { dir: 'popular-city',   prefix: 'popular-city-',            field: 'city' },
  { dir: 'popular-place',  prefix: 'popular-place-',           field: 'location' },
];

function toUrl(name) {
  return `https://www.pinterest.com/search/my_pins/?q=${encodeURIComponent(name)}`;
}

// --- Process standalone JSON files ---
for (const { file, field } of standaloneFiles) {
  const filePath = path.join(baseDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const lines = [];
  for (const item of data) {
    const name = item[field];
    lines.push(`${name}: ${toUrl(name)}`);
  }
  const outName = file.replace('.json', '-pinterest-links.txt');
  const outPath = path.join(outDir, outName);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`✓ ${outName}  (${lines.length} entries)`);
}

// --- Process subdirectory JSON files ---
for (const { dir, prefix, field } of subDirConfigs) {
  const dirPath = path.join(baseDir, dir);
  const files = fs.readdirSync(dirPath).filter(f => f.startsWith(prefix) && f.endsWith('.json'));
  const lines = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dirPath, f), 'utf-8'));
    const groupName = f.replace(prefix, '').replace('.json', '');
    lines.push(`\n=== ${groupName} ===`);
    for (const item of data) {
      const name = item[field];
      lines.push(`${name}: ${toUrl(name)}`);
    }
  }
  const outPath = path.join(outDir, `${dir}-pinterest-links.txt`);
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log(`✓ ${dir}-pinterest-links.txt  (${files.length} files)`);
}

console.log('\nAll done!');
