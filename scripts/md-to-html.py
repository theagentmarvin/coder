#!/usr/bin/env python3
import sys
import subprocess
import os
from pathlib import Path

def install_deps():
    deps = ['markdown2', 'beautifulsoup4', 'lxml']
    for dep in deps:
        try:
            __import__(dep.replace('-', '_'))
        except ImportError:
            print(f"Installing {dep}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
            print(f"Installed {dep}.")

def add_styles(soup):
    style_css = """
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
    color: #333;
    background: #fff;
}
h1, h2, h3, h4, h5, h6 {
    margin-top: 2em;
    margin-bottom: 1em;
}
h1 { font-size: 2.5em; }
h2 { font-size: 2em; }
#toc {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin: 20px 0;
}
#toc ul {
    list-style-type: none;
    padding-left: 0;
}
#toc li {
    margin: 5px 0;
}
.footnote {
    font-size: 0.85em;
    vertical-align: super;
    color: #666;
}
.footnotes {
    font-size: 0.9em;
    margin-top: 3em;
    padding-top: 2em;
    border-top: 2px solid #eee;
}
code {
    background: #f4f4f4;
    padding: 2px 4px;
    border-radius: 3px;
}
pre {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    overflow-x: auto;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
}
th, td {
    border: 1px solid #ddd;
    padding: 12px;
    text-align: left;
}
th {
    background: #f1f1f1;
}
"""
    if soup.head is None:
        head = soup.new_tag('head')
        soup.insert(0, head)
    style_tag = soup.new_tag('style')
    style_tag.string = style_css
    soup.head.append(style_tag)

def convert_md_to_html(input_path, output_path=None, stdin_input=None):
    install_deps()
    
    from markdown2 import markdown_path, Markdown
    import bs4
    
    if stdin_input:
        md_content = stdin_input
    else:
        with open(input_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
    
    # Convert MD to HTML with extras
    html = Markdown(extras=['toc', 'footnotes', 'fenced-code-blocks', 'tables', 'codeline-numbers']).convert(md_content)
    
    soup = bs4.BeautifulSoup(html, 'html.parser')
    
    # Add title if missing
    if not soup.title:
        title_tag = soup.new_tag('title')
        title_tag.string = Path(input_path).stem if input_path else 'Markdown to HTML'
        if soup.head is None:
            head = soup.new_tag('head')
            soup.insert(0, head)
        soup.head.append(title_tag)
    
    add_styles(soup)
    
    full_html = str(soup)
    
    if output_path:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(full_html)
        print(f"HTML saved to {output_path}")
    else:
        print(full_html)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python md-to-html.py <input.md> [output.html]")
        print("Or: echo 'md content' | python md-to-html.py -")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    if input_path == '-':
        stdin_input = sys.stdin.read()
        convert_md_to_html(None, output_path, stdin_input)
    else:
        convert_md_to_html(input_path, output_path)
