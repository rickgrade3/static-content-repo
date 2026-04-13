const fs = require('fs');
const path = require('path');

const dir = __dirname;
const outputFile = path.join(dir, 'pinterest-links.txt');

const files = fs.readdirSync(dir).filter(f => f.startsWith('popular-city-') && f.endsWith('.json'));

const lines = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  const countryName = file.replace('popular-city-', '').replace('.json', '');
  lines.push(`\n=== ${countryName} ===`);
  for (const item of data) {
    const query = encodeURIComponent(item.city);
    const url = `https://www.pinterest.com/search/my_pins/?q=${query}`;
    lines.push(`${item.city}: ${url}`);
  }
}

fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');
console.log(`Done! Written to: ${outputFile}`);
console.log(`Total country files processed: ${files.length}`);
