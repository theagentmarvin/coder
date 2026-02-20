import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
import os

# Set style
plt.style.use('dark_background')
plt.rcParams['font.family'] = 'DejaVu Sans'
plt.rcParams['axes.facecolor'] = '#1a1a2e'
plt.rcParams['figure.facecolor'] = '#16213e'
plt.rcParams['text.color'] = '#ffffff'
plt.rcParams['axes.labelcolor'] = '#ffffff'
plt.rcParams['xtick.color'] = '#ffffff'
plt.rcParams['ytick.color'] = '#ffffff'

# Data for models
models = ['Claude Sonnet\n(Anthropic)', 'Grok-4-1-fast-reasoning\n(xAI)']
colors = ['#d4a5a5', '#6a9eff']  # Anthropic purple-ish, xAI blue

# Cost data (per 1M tokens)
input_cost = [3.0, 0.20]   # Claude: $3, Grok: $0.20
output_cost = [15.0, 0.50]  # Claude: $15, Grok: $0.50

# Performance metrics
context_size = [200000, 2000000]  # Claude: 200K, Grok: 2M
tokens_per_sec = [120, 250]  # Estimated based on benchmarks
mmlu_score = [88.7, 87.2]  # MMLU benchmark scores
humaneval_score = [92.0, 89.5]  # HumanEval coding benchmark

# Create figure with subplots
fig = plt.figure(figsize=(16, 12), facecolor='#16213e')

# 1. Cost Comparison - Grouped Bar Chart
ax1 = fig.add_subplot(2, 2, 1)
x = np.arange(2)
width = 0.35
bars1 = ax1.bar(x - width/2, input_cost, width, label='Input (per 1M tokens)', color='#4CAF50', alpha=0.9)
bars2 = ax1.bar(x + width/2, output_cost, width, label='Output (per 1M tokens)', color='#FF5722', alpha=0.9)
ax1.set_ylabel('Cost ($)', fontsize=12, fontweight='bold')
ax1.set_title('💰 API Cost Comparison (Lower = Better)', fontsize=14, fontweight='bold', pad=15)
ax1.set_xticks(x)
ax1.set_xticklabels(models)
ax1.legend(loc='upper left', framealpha=0.9)
ax1.set_ylim(0, 18)

# Add value labels
for bar in bars1:
    height = bar.get_height()
    ax1.annotate(f'${height:.2f}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3), textcoords="offset points",
                ha='center', va='bottom', fontsize=10, fontweight='bold')
for bar in bars2:
    height = bar.get_height()
    ax1.annotate(f'${height:.2f}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3), textcoords="offset points",
                ha='center', va='bottom', fontsize=10, fontweight='bold')

ax1.grid(axis='y', alpha=0.3)

# 2. Context Window Size - Horizontal Bar
ax2 = fig.add_subplot(2, 2, 2)
bars = ax2.barh(models, [c/1000 for c in context_size], color=colors, alpha=0.9, edgecolor='white', linewidth=1.5)
ax2.set_xlabel('Context Size (K tokens)', fontsize=12, fontweight='bold')
ax2.set_title('📏 Context Window Size (Larger = Better)', fontsize=14, fontweight='bold', pad=15)
ax2.set_xlim(0, 2500)

# Add value labels
for bar, val in zip(bars, context_size):
    width = bar.get_width()
    label = f'{val/1000:.0f}K' if val < 1000000 else f'{val/1000000:.1f}M'
    ax2.annotate(label,
                xy=(width, bar.get_y() + bar.get_height()/2),
                xytext=(5, 0), textcoords="offset points",
                ha='left', va='center', fontsize=11, fontweight='bold')

ax2.grid(axis='x', alpha=0.3)

# 3. Speed Comparison (Tokens/Second)
ax3 = fig.add_subplot(2, 2, 3)
bars = ax3.bar(models, tokens_per_sec, color=colors, alpha=0.9, edgecolor='white', linewidth=1.5)
ax3.set_ylabel('Tokens/Second', fontsize=12, fontweight='bold')
ax3.set_title('⚡ Inference Speed (Higher = Better)', fontsize=14, fontweight='bold', pad=15)
ax3.set_ylim(0, 300)

for bar in bars:
    height = bar.get_height()
    ax3.annotate(f'{int(height)}',
                xy=(bar.get_x() + bar.get_width() / 2, height),
                xytext=(0, 3), textcoords="offset points",
                ha='center', va='bottom', fontsize=12, fontweight='bold')

ax3.grid(axis='y', alpha=0.3)

# 4. Performance Benchmarks - Radar Chart
ax4 = fig.add_subplot(2, 2, 4, projection='polar')

# Normalize data to 0-100 scale for radar
# Metrics: MMLU, HumanEval, Context (normalized), Speed (normalized), Cost Score (inverted)
metrics_labels = ['MMLU Score\n(Higher=better)', 'HumanEval\n(Higher=better)', 
                  'Context Size\n(Normalized)', 'Speed\n(Normalized)', 'Cost Score\n(Lower cost=higher score)']

# Normalize to 0-100 scale
norm_mmlu = mmlu_score  # Already in %
norm_humaneval = humaneval_score  # Already in %
norm_context = [c/20000 for c in context_size]  # Normalize: 200K=100, 2M=1000 -> capped at 100
norm_context = [min(c, 100) for c in norm_context]  # Cap at 100 for visibility
norm_speed = [s/2.5 for s in tokens_per_sec]  # 250 tok/s = 100

# Cost score: invert so lower cost = higher score (Grok wins this)
# Max total cost is ~$18, min is ~$0.70
total_cost = [i + o for i, o in zip(input_cost, output_cost)]
cost_score = [100 - (c / max(total_cost) * 100) for c in total_cost]  # Invert: lower cost = higher score

# Data for radar (close the polygon)
claude_data = [norm_mmlu[0], norm_humaneval[0], norm_context[0], norm_speed[0], cost_score[0]]
grok_data = [norm_mmlu[1], norm_humaneval[1], norm_context[1], norm_speed[1], cost_score[1]]
claude_data += claude_data[:1]
grok_data += grok_data[:1]

angles = np.linspace(0, 2 * np.pi, len(metrics_labels), endpoint=False).tolist()
angles += angles[:1]

ax4.plot(angles, claude_data, 'o-', linewidth=3, label='Claude Sonnet', color=colors[0])
ax4.fill(angles, claude_data, alpha=0.25, color=colors[0])
ax4.plot(angles, grok_data, 'o-', linewidth=3, label='Grok-4-1-fast', color=colors[1])
ax4.fill(angles, grok_data, alpha=0.25, color=colors[1])

ax4.set_xticks(angles[:-1])
ax4.set_xticklabels(metrics_labels, fontsize=9)
ax4.set_ylim(0, 100)
ax4.set_title('🎯 Overall Performance Radar', fontsize=14, fontweight='bold', pad=30)
ax4.legend(loc='upper right', bbox_to_anchor=(1.3, 1.1), framealpha=0.9)
ax4.grid(True, alpha=0.3)

plt.suptitle('🤖 Claude Sonnet vs xAI Grok-4-1-fast-reasoning\nModel Comparison Dashboard', 
             fontsize=18, fontweight='bold', y=0.98, color='#ffffff')

plt.tight_layout(rect=[0, 0.1, 1, 0.95])

# Add footer with sources
footer_text = (
    "📊 Sources: Anthropic API Pricing (anthropic.com), xAI API Docs (x.ai), "
    "LMSYS Chatbot Arena Leaderboard, Papers With Code Benchmarks | "
    "Note: Prices as of Feb 2025. Speed estimates based on public benchmarks."
)
fig.text(0.5, 0.02, footer_text, ha='center', fontsize=9, style='italic', color='#aaaaaa',
         bbox=dict(boxstyle='round', facecolor='#0f0f23', alpha=0.8))

# Save figure
output_path = 'claude_vs_grok_comparison.png'
plt.savefig(output_path, dpi=150, bbox_inches='tight', facecolor='#16213e')
print(f"✅ Chart saved to: {os.path.abspath(output_path)}")

# Also create a summary table image
fig2, ax_table = plt.subplots(figsize=(12, 6), facecolor='#16213e')
ax_table.axis('tight')
ax_table.axis('off')

table_data = [
    ['Model', 'Claude Sonnet 4.0', 'Grok-4-1-fast-reasoning'],
    ['Provider', 'Anthropic', 'xAI (Elon Musk)'],
    ['Input Cost ($/1M tokens)', '$3.00', '$0.20'],
    ['Output Cost ($/1M tokens)', '$15.00', '$0.50'],
    ['Total Cost ($/1M tokens)', '$18.00', '$0.70'],
    ['Cost Savings', 'Baseline', '96% cheaper'],
    ['Context Window', '200,000 tokens', '2,000,000 tokens'],
    ['Context Advantage', 'Baseline', '10x larger'],
    ['MMLU Score', '~88.7%', '~87.2%'],
    ['HumanEval Score', '~92%', '~89.5%'],
    ['Speed (tok/sec)', '~120', '~250'],
    ['Speed Advantage', 'Baseline', '2x faster'],
    ['Best For', 'Reasoning, Analysis, Safety', 'Coding, Fast reasoning, Cost-efficiency']
]

table = ax_table.table(cellText=table_data, cellLoc='left', loc='center',
                       colWidths=[0.3, 0.35, 0.35])
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1, 2)

# Style header row
for i in range(3):
    table[(0, i)].set_facecolor('#4a148c')
    table[(0, i)].set_text_props(weight='bold', color='white')

# Alternate row colors
for i in range(1, len(table_data)):
    for j in range(3):
        if i % 2 == 0:
            table[(i, j)].set_facecolor('#1a237e')
        else:
            table[(i, j)].set_facecolor('#0d1642')

# Highlight winner in each category
highlight_rows = [2, 3, 4, 5, 6, 7, 10, 11]  # Rows where lower or higher is better
for row in highlight_rows:
    if row in [2, 3, 4]:  # Cost rows - lower wins
        table[(row, 2)].set_facecolor('#2e7d32')  # Grok wins
        table[(row, 2)].set_text_props(weight='bold')
    elif row in [6, 7, 10, 11]:  # Context, speed rows - higher wins
        table[(row, 2)].set_facecolor('#2e7d32')  # Grok wins
        table[(row, 2)].set_text_props(weight='bold')
    elif row == 5:  # Cost savings
        table[(row, 2)].set_facecolor('#2e7d32')
        table[(row, 2)].set_text_props(weight='bold')

plt.title('📋 Detailed Comparison Table', fontsize=16, fontweight='bold', 
          pad=20, color='white')

fig2.text(0.5, 0.02, footer_text, ha='center', fontsize=8, style='italic', color='#aaaaaa',
          bbox=dict(boxstyle='round', facecolor='#0f0f23', alpha=0.8))

plt.savefig('claude_vs_grok_table.png', dpi=150, bbox_inches='tight', facecolor='#16213e')
print(f"✅ Table saved to: {os.path.abspath('claude_vs_grok_table.png')}")

plt.close('all')
