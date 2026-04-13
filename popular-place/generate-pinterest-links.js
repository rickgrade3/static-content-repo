const fs = require('fs');
const path = require('path');

const dir = __dirname;
const outputFile = path.join(dir, 'pinterest-links.txt');

const files = fs.readdirSync(dir).filter(f => f.startsWith('popular-place-') && f.endsWith('.json'));

const lines = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  const countryName = file.replace('popular-place-', '').replace('.json', '');
  lines.push(`\n=== ${countryName} ===`);
  for (const item of data) {
    const query = encodeURIComponent(item.location);
    const url = `https://www.pinterest.com/search/my_pins/?q=${query}`;
    lines.push(`${item.location}: ${url}`);
  }
}

fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');
console.log(`Done! Written to: ${outputFile}`);
console.log(`Total country files processed: ${files.length}`);
