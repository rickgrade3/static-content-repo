const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'historical.html');
const outputPath = process.argv[2]
    ? path.join(__dirname, process.argv[2])
    : path.join(__dirname, 'quote-important-person.json');

const html = fs.readFileSync(htmlPath, 'utf-8');

const quotes = [];

// ── Strategy 1: Parade-style (numbered list, optional author on next line) ──
// Lines look like: "25." → quote text → optional "Author Name"
function parseParadeStyle(html) {
    const article = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
    if (!article) return [];

    const text = article[1].replace(/<[^>]+>/g, '\n');
    const lines = text.split('\n')
        .map(l => l.replace(/\u00a0/g, ' ').replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim())
        .filter(l => l.length > 0);

    const results = [];
    const numLine = /^\d+\.?\s*$/;
    const quoteStart = /^[\u201c\u201d\u2018\u2019"']/;
    const noise = /^(related:|view |share|next|previous|read more|click|source|photo|image|advertisement|sign up)/i;

    let i = 0;
    while (i < lines.length) {
        if (!numLine.test(lines[i])) { i++; continue; }
        i++; // skip the number line

        // Collect all consecutive lines that form the quote text
        // A quote starts with a quotation character
        if (i >= lines.length || !quoteStart.test(lines[i])) continue;

        let quoteParts = [];
        while (i < lines.length && !numLine.test(lines[i])) {
            const l = lines[i];
            // Stop at noise lines once we have some quote content
            if (noise.test(l) && quoteParts.length > 0) { i++; break; }
            // Stop if we hit a new quote-starting line (means previous quote ended without closing)
            if (quoteStart.test(l) && quoteParts.length > 0) break;
            quoteParts.push(l);
            i++;
            // Once the joined text contains a closing curly quote, the quote is done
            const joined = quoteParts.join(' ');
            if (/[\u201d\u2019"]/.test(joined)) break;
        }

        if (quoteParts.length === 0) continue;
        let raw = quoteParts.join(' ').trim();

        // Check if next line(s) are an author (not a number, not a quote, short)
        let byParts = [];
        while (i < lines.length && !numLine.test(lines[i]) && !quoteStart.test(lines[i]) && !noise.test(lines[i])) {
            const peek = lines[i];
            // Author lines: short, start with uppercase, not more noise
            if (peek.length < 80 && /^[A-Z\u00C0-\u024F,]/.test(peek)) {
                byParts.push(peek);
                i++;
            } else {
                break;
            }
        }

        const quote = raw.replace(/^[\u201c\u201d\u2018\u2019"']+|[\u201c\u201d\u2018\u2019"'.]+$/g, '').trim();
        const by = byParts.join(' ').replace(/^,\s*|,\s*$/, '').trim();

        if (quote.length > 5) {
            results.push({ quote, by });
        }
    }
    return results;
}

// ── Strategy 2: Shopify-style (<ol><li> with —Author at end) ──
function parseShopifyStyle(html) {
    const results = [];
    const liRegex = /<li>([\s\S]*?)<\/li>/g;
    let match;
    while ((match = liRegex.exec(html)) !== null) {
        const rawText = match[1]
            .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, '').trim();

        const separators = ['\u2014', '\u2013'];
        let quote = '', by = '';
        for (const sep of separators) {
            const idx = rawText.lastIndexOf(sep);
            if (idx !== -1) {
                quote = rawText.slice(0, idx).trim();
                by = rawText.slice(idx + sep.length).trim();
                break;
            }
        }
        if (!quote || !by || by.length >= 80) continue;
        quote = quote.replace(/^[\u201c\u201d\u2018\u2019"']+|[\u201c\u201d\u2018\u2019"'.]+$/g, '').trim();
        by = by.replace(/[.]+$/, '').trim();
        if (quote && by) results.push({ quote, by });
    }
    return results;
}

// ── Strategy 3: Squarespace .summary-excerpt style ──
function parseSquarespaceStyle(html) {
    const results = [];
    const excerptRegex = /<div class="\s*summary-excerpt[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/g;
    let match;
    while ((match = excerptRegex.exec(html)) !== null) {
        const rawText = match[1]
            .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'")
            .replace(/<[^>]+>/g, '').trim();
        if (!rawText) continue;
        const withoutNumber = rawText.replace(/^\d+\.\s*/, '');
        const separators = [' \u2013 ', ' \u2014 ', '\u2013 ', '\u2014 ', ' - '];
        let quote = withoutNumber, by = '';
        for (const sep of separators) {
            const idx = withoutNumber.lastIndexOf(sep);
            if (idx !== -1) {
                quote = withoutNumber.slice(0, idx).trim();
                by = withoutNumber.slice(idx + sep.length).trim();
                break;
            }
        }
        quote = quote.replace(/^[\u201c\u201d\u2018\u2019"']+|[\u201c\u201d\u2018\u2019"']+$/g, '').trim();
        if (quote && by) results.push({ quote, by });
    }
    return results;
}

// Try strategies in order, use whichever yields the most results
const results = [
    parseParadeStyle(html),
    parseShopifyStyle(html),
    parseSquarespaceStyle(html),
].sort((a, b) => b.length - a.length)[0];

quotes.push(...results);

fs.writeFileSync(outputPath, JSON.stringify(quotes, null, 4), 'utf-8');
console.log(`Done. Extracted ${quotes.length} quotes to ${outputPath}`);
