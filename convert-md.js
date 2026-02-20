const fs = require('fs');
const path = require('path');

// Read the markdown file
const mdPath = '/home/marvin/.openclaw/workspace-wiki-marvin/reports/2026-02-15-el-salvador-mining-complete-report.md';
const mdContent = fs.readFileSync(mdPath, 'utf8');

// Simple markdown parser for e-reader HTML
function markdownToHtml(md) {
    let html = md;
    
    // Extract footnotes first
    const footnotes = {};
    const footnoteRegex = /\[\^(\d+)\]:\s*(.+?)(?=\n\[\^|\n---|\n## |$)/gs;
    let fnMatch;
    while ((fnMatch = footnoteRegex.exec(md)) !== null) {
        footnotes[fnMatch[1]] = fnMatch[2].trim();
    }
    
    // Remove footnote definitions from content
    html = html.replace(/\[\^\d+\]:\s*.+?(?=\n\[\^|\n---|\n## |$)/gs, '');
    
    // Convert footnote references
    html = html.replace(/\[\^(\d+)\]/g, '<sup class="footnote-ref"><a href="#fn$1" id="fnref$1">[$1]</a></sup>');
    
    // Convert headers and build TOC
    let toc = [];
    let tocIndex = 0;
    html = html.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
        const level = hashes.length;
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        const anchor = `${id}-${tocIndex++}`;
        toc.push({ level, title, anchor });
        return `<h${level} id="${anchor}">${title}</h${level}>`;
    });
    
    // Convert bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Convert blockquotes
    html = html.replace(/^>(.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/<\/blockquote>\s*<blockquote>/g, '<br>');
    
    // Convert tables
    // Find table blocks
    const tableRegex = /\|(.+?)\|\n\|[-:\| ]+\|\n((?:\|.+?\|\n?)+)/g;
    html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
        const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
        const rows = bodyRows.trim().split('\n').map(row => {
            const cells = row.split('|').map(c => c.trim()).filter(c => c);
            return cells;
        });
        
        let tableHtml = '<table><thead><tr>';
        headers.forEach(h => {
            tableHtml += `<th>${h}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';
        
        rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
                tableHtml += `<td>${cell}</td>`;
            });
            tableHtml += '</tr>';
        });
        tableHtml += '</tbody></table>';
        return tableHtml;
    });
    
    // Convert horizontal rules
    html = html.replace(/^---\s*$/gm, '<hr>');
    
    // Convert line breaks in paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
        p = p.trim();
        if (!p) return '';
        if (p.startsWith('<h') || p.startsWith('<table') || p.startsWith('<blockquote') || p.startsWith('<hr')) {
            return p;
        }
        // Handle list items
        if (p.match(/^[-\*]\s+/m)) {
            const items = p.split('\n').filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '));
            if (items.length > 0) {
                return '<ul>' + items.map(item => {
                    const content = item.trim().replace(/^[-\*]\s+/, '');
                    return `<li>${content}</li>`;
                }).join('') + '</ul>';
            }
        }
        return `<p>${p.replace(/\n/g, ' ')}</p>`;
    }).join('\n');
    
    return { html, toc, footnotes };
}

const { html: bodyHtml, toc, footnotes } = markdownToHtml(mdContent);

// Build TOC HTML
let tocHtml = '<nav class="toc"><h2>Table of Contents</h2><ul>';
toc.forEach(item => {
    const indent = '  '.repeat(item.level - 1);
    tocHtml += `${indent}<li class="toc-level-${item.level}"><a href="#${item.anchor}">${item.title}</a></li>`;
});
tocHtml += '</ul></nav>';

// Build footnotes HTML
let footnotesHtml = '';
if (Object.keys(footnotes).length > 0) {
    footnotesHtml = '<section class="footnotes"><h2>References</h2><ol>';
    for (const [num, text] of Object.entries(footnotes)) {
        footnotesHtml += `<li id="fn${num}">${text} <a href="#fnref${num}">↩</a></li>`;
    }
    footnotesHtml += '</ol></section>';
}

// E-reader optimized HTML template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The History of Mining in El Salvador</title>
    <style>
        /* E-reader optimized styles */
        :root {
            --bg-color: #fafafa;
            --text-color: #1a1a1a;
            --accent-color: #2c5282;
            --border-color: #e2e8f0;
            --quote-bg: #f7fafc;
        }
        
        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #1a1a1a;
                --text-color: #e2e8f0;
                --accent-color: #63b3ed;
                --border-color: #4a5568;
                --quote-bg: #2d3748;
            }
        }
        
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: Georgia, "Times New Roman", serif;
            font-size: 18px;
            line-height: 1.8;
            max-width: 720px;
            margin: 0 auto;
            padding: 40px 20px;
            background: var(--bg-color);
            color: var(--text-color);
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-weight: 600;
            line-height: 1.3;
            margin-top: 2em;
            margin-bottom: 0.5em;
            color: var(--accent-color);
        }
        
        h1 {
            font-size: 2.2em;
            text-align: center;
            margin-top: 0;
            padding-bottom: 0.5em;
            border-bottom: 3px solid var(--accent-color);
        }
        
        h2 {
            font-size: 1.6em;
            padding-bottom: 0.3em;
            border-bottom: 1px solid var(--border-color);
        }
        
        h3 {
            font-size: 1.3em;
        }
        
        h4 {
            font-size: 1.1em;
        }
        
        p {
            margin-bottom: 1.2em;
            text-align: justify;
            hyphens: auto;
        }
        
        /* Executive summary styling */
        h2:first-of-type + p + ul {
            background: var(--quote-bg);
            padding: 1em 1.5em;
            border-left: 4px solid var(--accent-color);
            border-radius: 4px;
        }
        
        /* Table of Contents */
        .toc {
            background: var(--quote-bg);
            padding: 1.5em;
            border-radius: 8px;
            margin: 2em 0;
            border: 1px solid var(--border-color);
        }
        
        .toc h2 {
            margin-top: 0;
            font-size: 1.3em;
            border-bottom: none;
            text-align: center;
        }
        
        .toc ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        .toc li {
            margin: 0.4em 0;
        }
        
        .toc li.toc-level-1 {
            font-weight: 600;
        }
        
        .toc li.toc-level-2 {
            padding-left: 1.5em;
        }
        
        .toc li.toc-level-3 {
            padding-left: 3em;
            font-size: 0.95em;
        }
        
        .toc a {
            color: var(--text-color);
            text-decoration: none;
        }
        
        .toc a:hover {
            color: var(--accent-color);
            text-decoration: underline;
        }
        
        /* Links */
        a {
            color: var(--accent-color);
            text-decoration: underline;
            text-underline-offset: 2px;
        }
        
        a:hover {
            text-decoration: none;
        }
        
        /* Blockquotes */
        blockquote {
            margin: 1.5em 0;
            padding: 1em 1.5em;
            background: var(--quote-bg);
            border-left: 4px solid var(--accent-color);
            font-style: italic;
            border-radius: 0 4px 4px 0;
        }
        
        blockquote p {
            margin: 0;
        }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            font-size: 0.95em;
            overflow-x: auto;
            display: block;
        }
        
        thead {
            background: var(--quote-bg);
        }
        
        th, td {
            padding: 0.75em;
            text-align: left;
            border: 1px solid var(--border-color);
        }
        
        th {
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        tr:nth-child(even) {
            background: var(--quote-bg);
        }
        
        /* Lists */
        ul, ol {
            margin: 1em 0;
            padding-left: 2em;
        }
        
        li {
            margin: 0.5em 0;
        }
        
        /* Horizontal rule */
        hr {
            border: none;
            border-top: 2px solid var(--border-color);
            margin: 2em 0;
        }
        
        /* Footnotes */
        .footnote-ref {
            font-size: 0.75em;
            vertical-align: super;
        }
        
        .footnote-ref a {
            text-decoration: none;
            padding: 0 2px;
        }
        
        .footnotes {
            margin-top: 3em;
            padding-top: 1.5em;
            border-top: 2px solid var(--border-color);
        }
        
        .footnotes h2 {
            font-size: 1.3em;
        }
        
        .footnotes ol {
            font-size: 0.9em;
            padding-left: 1.5em;
        }
        
        .footnotes li {
            margin: 0.8em 0;
        }
        
        /* Key Points styling */
        strong:contains("Key Points:") {
            color: var(--accent-color);
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            body {
                font-size: 16px;
                padding: 20px 15px;
            }
            
            h1 {
                font-size: 1.7em;
            }
            
            h2 {
                font-size: 1.3em;
            }
            
            table {
                font-size: 0.85em;
            }
            
            th, td {
                padding: 0.5em;
            }
        }
        
        /* Print styles */
        @media print {
            body {
                font-size: 12pt;
                max-width: none;
            }
            
            .toc {
                page-break-after: always;
            }
            
            h1, h2, h3 {
                page-break-after: avoid;
            }
            
            table {
                page-break-inside: avoid;
            }
        }
        
        /* Smooth scrolling */
        html {
            scroll-behavior: smooth;
        }
    </style>
</head>
<body>
${bodyHtml}
${tocHtml}
${footnotesHtml}
</body>
</html>`;

// Write output
const outputPath = '/home/marvin/.openclaw/workspace/viz-deploy/projects/mining-full-reader/index.html';
fs.writeFileSync(outputPath, htmlTemplate);

console.log('✅ E-reader HTML generated successfully!');
console.log(`📄 Output: ${outputPath}`);
console.log(`📊 TOC entries: ${toc.length}`);
console.log(`📚 Footnotes: ${Object.keys(footnotes).length}`);
