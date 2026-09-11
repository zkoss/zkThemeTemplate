#!/usr/bin/env python3
"""summarize-cmp.py <compare.json> — one line per PNG from compare.config.ts: IDENTICAL (or WITHIN-TOLERANCE
for a $ZERO_TOLERATED exception that passed at the template's own tolerance), or the pixel count / size
mismatch / NO-BASELINE that Playwright's comparator reported. Exit 1 if anything differs."""
import collections, json, re, sys

d = json.load(open(sys.argv[1]))
rows = []

def walk(s):
    for sp in s.get('specs', []):
        for t in sp['tests']:
            r = t['results'][-1]
            msg = re.sub(r'\x1b\[[0-9;]*m', '', (r.get('error') or {}).get('message', ''))
            px = re.search(r'(\d+) pixels \(ratio ([0-9.]+)', msg)
            size = re.search(r'Expected an image (\d+)px by (\d+)px, received (\d+)px by (\d+)px', msg)
            title, tolerated = sp['title'].replace(' @tolerated', ''), sp['title'].endswith(' @tolerated')
            if r['status'] == 'passed':
                why = 'WITHIN-TOLERANCE' if tolerated else 'IDENTICAL'
            elif 'NO-BASELINE' in msg:
                why = 'NO-BASELINE'
            elif size:
                why = 'SIZE %sx%s -> %sx%s' % size.groups()
            elif px:
                why = 'DIFF %s px' % px.group(1)
            else:
                why = r['status'].upper()
            rows.append((title, why))
    for x in s.get('suites', []):
        walk(x)

for s in d['suites']:
    walk(s)
rows.sort()
for name, why in rows:
    print('%-45s %s' % (name, why))
c = collections.Counter(w.split()[0] for _, w in rows)
print('--- total %d: %s' % (len(rows), ', '.join('%s %d' % kv for kv in sorted(c.items()))))
sys.exit(0 if c.get('IDENTICAL', 0) + c.get('WITHIN-TOLERANCE', 0) == len(rows) else 1)
