#!/usr/bin/env node
/** Expense Excel Generation - Node.js */
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(process.env.HOME || '/home/marvin', 'projects/bim/expenses/output');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function generateExcel(monthKey, receipts) {
  // Filter active and sort by date
  const activeReceipts = receipts
    .filter(r => r.status === 'active')
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  
  // Prepare data
  const data = [['Date', 'Description', 'Category', 'Original Amount', 'Currency', 'FX Rate', 'Amount EUR']];
  
  for (const r of activeReceipts) {
    const desc = r.vendor && r.description ? `${r.vendor} - ${r.description}` : (r.vendor || r.description || 'N/A');
    data.push([
      r.date || '',
      desc,
      r.category || '',
      r.original_amount || 0,
      r.original_currency || '',
      r.fx_rate || 1,
      r.amount_eur || 0
    ]);
  }
  
  // Add totals row
  data.push(['TOTAL', '', '', '', '', '', '']);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 14 }
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  
  // Add SUM formula to total row
  const totalRow = activeReceipts.length + 2;
  ws[`G${totalRow}`] = { t: 'n', f: `SUM(G2:G${totalRow - 1})` };
  
  // Save
  const [year, month] = monthKey.split('-');
  const filename = `expenses_${year}_${month}.xlsx`;
  const filepath = path.join(OUTPUT_DIR, filename);
  XLSX.writeFile(wb, filepath);
  
  return filepath;
}

module.exports = { generateExcel };

// CLI test
if (require.main === module) {
  const testReceipts = [
    { date: '2026-02-01', vendor: 'Uber', description: 'Airport ride', category: 'travel', original_amount: 25.00, original_currency: 'USD', fx_rate: 0.92, amount_eur: 23.00, status: 'active' },
    { date: '2026-02-05', vendor: 'Restaurant El Huaso', description: 'Team lunch', category: 'food', original_amount: 45.00, original_currency: 'EUR', fx_rate: 1.0, amount_eur: 45.00, status: 'active' }
  ];
  const filepath = generateExcel('2026-02', testReceipts);
  console.log('Generated:', filepath);
}
