const fs = require('fs');
const path = require('path');

const sourceFiles = [
    'quote-funny.json',
    'quote-important-person.json',
    'quote-motivation.json',
];

const longQuoteFile = 'quote-long.json';
const maxLength = 100;

const baseDir = __dirname;
const longQuotePath = path.join(baseDir, longQuoteFile);

let longQuotes = [];
if (fs.existsSync(longQuotePath)) {
    longQuotes = JSON.parse(fs.readFileSync(longQuotePath, 'utf-8'));
}

for (const file of sourceFiles) {
    const filePath = path.join(baseDir, file);
    const quotes = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const short = [];
    const long = [];

    for (const item of quotes) {
        if (item.quote.length > maxLength) {
            long.push(item);
        } else {
            short.push(item);
        }
    }

    if (long.length > 0) {
        console.log(`${file}: moved ${long.length} long quote(s)`);
        longQuotes.push(...long);
        fs.writeFileSync(filePath, JSON.stringify(short, null, 4), 'utf-8');
    } else {
        console.log(`${file}: no long quotes found`);
    }
}

fs.writeFileSync(longQuotePath, JSON.stringify(longQuotes, null, 4), 'utf-8');
console.log(`\nTotal long quotes in ${longQuoteFile}: ${longQuotes.length}`);
