const fs = require('fs');
const path = require('path');

const dir = __dirname;
const outputFile = path.join(dir, 'pinterest-links.txt');

const files = fs.readdirSync(dir).filter(f => f.startsWith('popular-anime-character-') && f.endsWith('.json'));

const lines = [];

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  const animeName = file.replace('popular-anime-character-', '').replace('.json', '');
  lines.push(`\n=== ${animeName} ===`);
  for (const char of data) {
    const query = encodeURIComponent(char.title);
    const url = `https://www.pinterest.com/search/my_pins/?q=${query}`;
    lines.push(`${char.title}: ${url}`);
  }
}

fs.writeFileSync(outputFile, lines.join('\n'), 'utf-8');
console.log(`Done! Written to: ${outputFile}`);
console.log(`Total anime files processed: ${files.length}`);
