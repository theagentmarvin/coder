#!/usr/bin/env node
/** Expense Word Generation - Node.js */
const { Document, Packer, Paragraph, TextRun, ImageRun } = require('docx');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(process.env.HOME || '/home/marvin', 'projects/bim/expenses/output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const IMAGE_WIDTH_INCHES = 4.6;

function getMonthName(monthNum) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const idx = parseInt(monthNum, 10) - 1;
  return idx >= 0 && idx < 12 ? months[idx] : monthNum;
}

async function generateWord(monthKey, receipts) {
  // Filter active and sort by date
  const activeReceipts = receipts
    .filter(r => r.status === 'active')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  
  const children = [];
  
  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Expense Receipts - ${monthKey}`, bold: true, size: 28 })],
      alignment: 'center'
    })
  );
  children.push(new Paragraph(''));  // Spacing
  
  for (const r of activeReceipts) {
    const vendor = r.vendor || 'Unknown';
    const desc = r.description || '';
    const date = r.date || '';
    const amount = r.amount_eur || 0;
    
    // Label
    let labelText = `${date} - ${vendor}`;
    if (desc) labelText += `: ${desc}`;
    labelText += ` (${amount.toFixed(2)} EUR)`;
    
    children.push(
      new Paragraph({
        children: [new TextRun({ text: labelText, bold: true })],
        spacing: { after: 200 }
      })
    );
    
    // Image
    const imagePath = r.image_path || '';
    if (imagePath && fs.existsSync(imagePath)) {
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imageBuffer,
                transformation: { width: IMAGE_WIDTH_INCHES * 72, height: IMAGE_WIDTH_INCHES * 72 },
              })
            ],
            spacing: { after: 400 }
          })
        );
      } catch (e) {
        children.push(new Paragraph({ children: [new TextRun({ text: '[Image error]' })] }));
      }
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: '[No receipt image]' })] }));
    }
  }
  
  const doc = new Document({
    sections: [{ children }]
  });
  
  // Save
  const [year, month] = monthKey.split('-');
  const monthName = getMonthName(month);
  const filename = `RZE_-_Travel_and_Expenses_Dalux_${monthName}_${year}.docx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filepath, buffer);
  
  return filepath;
}

module.exports = { generateWord, getMonthName };

// CLI test
if (require.main === module) {
  const testReceipts = [
    { date: '2026-02-01', vendor: 'Uber', description: 'Airport ride', amount_eur: 23.00, image_path: '', status: 'active' }
  ];
  generateWord('2026-02', testReceipts).then(filepath => console.log('Generated:', filepath));
}
