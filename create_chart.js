const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a large canvas for the dashboard
const width = 1600;
const height = 1200;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Background
const gradient = ctx.createLinearGradient(0, 0, 0, height);
gradient.addColorStop(0, '#16213e');
gradient.addColorStop(1, '#1a1a2e');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, width, height);

// Title
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 32px Arial';
ctx.textAlign = 'center';
ctx.fillText('🤖 Claude Sonnet vs xAI Grok-4-1-fast-reasoning', width/2, 50);
ctx.font = '24px Arial';
ctx.fillText('Model Comparison Dashboard', width/2, 85);

// Helper function for drawing bars
function drawBar(ctx, x, y, w, h, color, label, value) {
    // Bar background
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1.0;
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    
    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 5);
    
    // Value
    ctx.font = 'bold 16px Arial';
    ctx.fillText(value, x + 5, y + h/2 + 5);
}

// === SECTION 1: Cost Comparison ===
ctx.fillStyle = '#4CAF50';
ctx.fillRect(50, 120, 700, 250);
ctx.strokeStyle = '#ffffff';
ctx.lineWidth = 2;
ctx.strokeRect(50, 120, 700, 250);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.fillText('💰 API Cost Comparison (Lower = Better)', 400, 150);

// Claude costs
ctx.fillStyle = '#d4a5a5';
ctx.fillRect(100, 280, 200, 60);
ctx.strokeRect(100, 280, 200, 60);
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 16px Arial';
ctx.textAlign = 'center';
ctx.fillText('Claude Sonnet', 200, 270);
ctx.fillText('Input: $3.00/1M', 200, 305);
ctx.fillText('Output: $15.00/1M', 200, 325);

// Grok costs
ctx.fillStyle = '#6a9eff';
ctx.fillRect(350, 280, 350, 60);
ctx.strokeRect(350, 280, 350, 60);
ctx.fillStyle = '#ffffff';
ctx.fillText('Grok-4-1-fast-reasoning', 525, 270);
ctx.fillText('Input: $0.20/1M | Output: $0.50/1M', 525, 315);

// Cost savings annotation
ctx.fillStyle = '#FFD700';
ctx.font = 'bold 18px Arial';
ctx.fillText('⬇️ 96% cheaper', 525, 245);

// === SECTION 2: Context Size ===
ctx.fillStyle = '#2196F3';
ctx.fillRect(850, 120, 700, 250);
ctx.strokeRect(850, 120, 700, 250);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 20px Arial';
ctx.fillText('📏 Context Window Size (Larger = Better)', 1200, 150);

// Claude context
ctx.fillStyle = '#d4a5a5';
ctx.fillRect(900, 280, 150, 60);
ctx.strokeRect(900, 280, 150, 60);
ctx.fillStyle = '#ffffff';
ctx.fillText('Claude Sonnet', 975, 270);
ctx.fillText('200K tokens', 975, 315);

// Grok context
ctx.fillStyle = '#6a9eff';
ctx.fillRect(1100, 220, 400, 120);
ctx.strokeRect(1100, 220, 400, 120);
ctx.fillStyle = '#ffffff';
ctx.fillText('Grok-4-1-fast-reasoning', 1300, 255);
ctx.font = 'bold 28px Arial';
ctx.fillText('2,000,000 tokens', 1300, 295);
ctx.font = '16px Arial';
ctx.fillText('10x larger context!', 1300, 320);

// === SECTION 3: Performance Metrics ===
ctx.fillStyle = '#FF9800';
ctx.fillRect(50, 400, 1500, 350);
ctx.strokeRect(50, 400, 1500, 350);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 20px Arial';
ctx.fillText('🎯 Performance Benchmarks', 800, 430);

// Create comparison bars
const metrics = [
    { name: 'MMLU Score', claude: 88.7, grok: 87.2, unit: '%' },
    { name: 'HumanEval (Coding)', claude: 92.0, grok: 89.5, unit: '%' },
    { name: 'Speed (tok/sec)', claude: 120, grok: 250, unit: '' }
];

let yPos = 470;
metrics.forEach(metric => {
    const maxVal = Math.max(metric.claude, metric.grok);
    const claudeWidth = (metric.claude / maxVal) * 400;
    const grokWidth = (metric.grok / maxVal) * 400;
    
    // Metric label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(metric.name, 80, yPos + 20);
    
    // Claude bar
    ctx.fillStyle = '#d4a5a5';
    ctx.fillRect(300, yPos, claudeWidth, 35);
    ctx.strokeRect(300, yPos, claudeWidth, 35);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`${metric.claude}${metric.unit}`, 310, yPos + 23);
    
    // Grok bar
    ctx.fillStyle = '#6a9eff';
    ctx.fillRect(750, yPos, grokWidth, 35);
    ctx.strokeRect(750, yPos, grokWidth, 35);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${metric.grok}${metric.unit}`, 760, yPos + 23);
    
    yPos += 60;
});

// Legend
ctx.fillStyle = '#d4a5a5';
ctx.fillRect(1200, 470, 30, 30);
ctx.strokeRect(1200, 470, 30, 30);
ctx.fillStyle = '#ffffff';
ctx.font = '16px Arial';
ctx.fillText('Claude Sonnet', 1240, 490);

ctx.fillStyle = '#6a9eff';
ctx.fillRect(1200, 510, 30, 30);
ctx.strokeRect(1200, 510, 30, 30);
ctx.fillStyle = '#ffffff';
ctx.fillText('Grok-4-1-fast-reasoning', 1240, 530);

// === SECTION 4: Summary Table ===
ctx.fillStyle = '#9C27B0';
ctx.fillRect(50, 780, 1500, 350);
ctx.strokeRect(50, 780, 1500, 350);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 20px Arial';
ctx.textAlign = 'center';
ctx.fillText('📋 Detailed Comparison Summary', 800, 810);

// Table headers
const colX = [80, 500, 1000];
const headers = ['Metric', 'Claude Sonnet', 'Grok-4-1-fast-reasoning'];
ctx.font = 'bold 16px Arial';
headers.forEach((h, i) => {
    ctx.fillStyle = '#4a148c';
    ctx.fillRect(colX[i], 830, 400, 30);
    ctx.strokeRect(colX[i], 830, 400, 30);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(h, colX[i] + 200, 850);
});

// Table data
const tableData = [
    ['Provider', 'Anthropic', 'xAI (Elon Musk)'],
    ['Input Cost ($/1M)', '$3.00', '$0.20'],
    ['Output Cost ($/1M)', '$15.00', '$0.50'],
    ['Total Cost ($/1M)', '$18.00', '$0.70 (96% cheaper)'],
    ['Context Window', '200,000 tokens', '2,000,000 tokens (10x larger)'],
    ['MMLU Score', '~88.7%', '~87.2%'],
    ['HumanEval', '~92%', '~89.5%'],
    ['Speed', '~120 tok/sec', '~250 tok/sec (2x faster)'],
    ['Best For', 'Reasoning, Safety', 'Coding, Fast reasoning, Cost-efficiency']
];

let rowY = 870;
tableData.forEach((row, rowIdx) => {
    const bgColor = rowIdx % 2 === 0 ? '#1a237e' : '#0d1642';
    row.forEach((cell, colIdx) => {
        ctx.fillStyle = bgColor;
        ctx.fillRect(colX[colIdx], rowY, 400, 28);
        ctx.strokeRect(colX[colIdx], rowY, 400, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = colIdx === 0 ? 'bold 14px Arial' : '14px Arial';
        ctx.textAlign = 'left';
        
        // Highlight winner in cost/context/speed
        let textColor = '#ffffff';
        if (colIdx === 2 && (rowIdx === 3 || rowIdx === 4 || rowIdx === 7)) {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(colX[colIdx], rowY, 400, 28);
            ctx.strokeRect(colX[colIdx], rowY, 400, 28);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
        }
        
        ctx.fillText(cell, colX[colIdx] + 10, rowY + 20);
    });
    rowY += 28;
});

// Footer
ctx.fillStyle = '#0f0f23';
ctx.fillRect(50, 1140, 1500, 50);
ctx.strokeRect(50, 1140, 1500, 50);
ctx.fillStyle = '#aaaaaa';
ctx.font = 'italic 12px Arial';
ctx.textAlign = 'center';
ctx.fillText(
    '📊 Sources: Anthropic API Pricing (anthropic.com), xAI API Docs (x.ai), LMSYS Chatbot Arena Leaderboard | Prices as of Feb 2025. Speed estimates based on public benchmarks.',
    800, 1170
);

// Save the image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('claude_vs_grok_comparison.png', buffer);
console.log('✅ Dashboard saved to:', path.resolve('claude_vs_grok_comparison.png'));
