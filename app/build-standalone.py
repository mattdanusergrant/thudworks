#!/usr/bin/env python3
"""Bundle the THUDWORKS app into one double-clickable HTML file (no server needed).
Inlines style.css and merges the 3 ES modules into a single classic <script>
(strips import/export) so it runs from file:// — modules don't.
Run: python3 07_projects/thudworks/app/build-standalone.py
Out: 07_projects/thudworks/app/thudworks-standalone.html
"""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
read = lambda f: open(os.path.join(HERE, f)).read()

def strip_module(js):
    out = []
    for line in js.splitlines():
        if re.match(r'\s*import\s', line):           # drop import lines
            continue
        line = re.sub(r'^\s*export\s+(function|class|const|let|var)\s', r'\1 ', line)
        out.append(line)
    return "\n".join(out)

css = read('style.css')
js = "\n".join(strip_module(read(f)) for f in ('synth.js', 'sequencer.js', 'app.js'))

html = read('index.html')
html = html.replace('<link rel="stylesheet" href="style.css" />', f'<style>\n{css}\n</style>')
html = html.replace('<script type="module" src="app.js"></script>', f'<script>\n{js}\n</script>')

open(os.path.join(HERE, 'thudworks-standalone.html'), 'w').write(html)
open(os.path.join(HERE, '_combined.check.js'), 'w').write(js)   # for node --check
print("wrote thudworks-standalone.html (%d bytes)" % len(html))
