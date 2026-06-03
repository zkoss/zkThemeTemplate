/**
 * Universal Sanity Tier — outcome-level health checks that run on every
 * Evaluator dispatch regardless of contract.  See
 * .claude/agents/zk-theme-evaluator.md §3c (active spec) and
 * tasks/outcome-driven-verification-proposal.md (rationale).
 *
 * Usage in a browser page (via mcp__claude-in-chrome__javascript_tool):
 *
 *   // 1. paste this whole file into the page (one-shot eval)
 *   // 2. call:
 *   window.__sanityTier({
 *     rootSelector: '.z-goldenlayout',
 *     isLayoutComponent: true,        // default true
 *     minLayoutHeight: 100,           // default 50
 *     overlapTolerancePx: 1,          // default 1
 *     overflowTolerancePx: 2          // default 2
 *   });
 *
 * Returns:
 *   {
 *     results: {
 *       'collapsed-root':    {status: 'PASS'|'FAIL'|'SKIP', actual, reason},
 *       'text-collision':    {status, actual, reason, samples?},
 *       'child-overflow':    {status, actual, reason, samples?},
 *       'layout-not-engaged':{status, actual, reason}
 *     },
 *     allPass: boolean
 *   }
 *
 * The script is intentionally self-contained (no imports), short, and
 * pure-read — never mutates the DOM.
 */
(function () {
  'use strict';

  function bbox(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, right: r.right, bottom: r.bottom };
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function isTextLeaf(el) {
    // A node we want to treat as "a text element" for collision purposes:
    // - has direct text content (non-whitespace)
    // - is visible
    // - does NOT have an element child that itself has text (avoid double counting)
    if (!isVisible(el)) return false;
    let direct = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) direct += n.textContent;
    }
    if (!direct.trim()) return false;
    for (const child of el.children) {
      if (isTextLeaf(child)) return false; // a child is a closer leaf; defer to it
    }
    return true;
  }

  function bboxesOverlap(a, b, tol) {
    const overlapX = Math.min(a.right, b.right) - Math.max(a.x, b.x);
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.y, b.y);
    return overlapX > tol && overlapY > tol;
  }

  function check_collapsedRoot(root, opts) {
    if (!opts.isLayoutComponent) return { status: 'SKIP', reason: 'not a layout component' };
    const b = bbox(root);
    if (b.h < opts.minLayoutHeight) {
      return { status: 'FAIL', actual: `${Math.round(b.h)}px`, reason: `root height < ${opts.minLayoutHeight}px (component collapsed)` };
    }
    return { status: 'PASS', actual: `${Math.round(b.h)}px`, reason: '' };
  }

  function check_textCollision(root, opts) {
    const all = [root, ...root.querySelectorAll('*')].filter(isTextLeaf);
    const samples = [];
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        // ignore ancestor/descendant relationships (overlap is expected)
        if (all[i].contains(all[j]) || all[j].contains(all[i])) continue;
        const ba = bbox(all[i]), bb = bbox(all[j]);
        if (bboxesOverlap(ba, bb, opts.overlapTolerancePx)) {
          samples.push({
            a: cssPath(all[i]),
            b: cssPath(all[j]),
            aText: (all[i].textContent || '').trim().slice(0, 40),
            bText: (all[j].textContent || '').trim().slice(0, 40)
          });
          if (samples.length >= 5) break;
        }
      }
      if (samples.length >= 5) break;
    }
    if (samples.length) {
      return { status: 'FAIL', actual: `${samples.length}+ collisions`, reason: 'overlapping text nodes detected', samples };
    }
    return { status: 'PASS', actual: '0 collisions', reason: '' };
  }

  function check_childOverflow(root, opts) {
    const rb = bbox(root);
    const samples = [];
    for (const child of root.querySelectorAll('*')) {
      if (!isVisible(child)) continue;
      const cs = getComputedStyle(child);
      // Skip elements with position: fixed (e.g. modals, dropdowns intentionally outside)
      if (cs.position === 'fixed') continue;
      const cb = bbox(child);
      const overflowR = cb.right - rb.right;
      const overflowB = cb.bottom - rb.bottom;
      const overflowL = rb.x - cb.x;
      const overflowT = rb.y - cb.y;
      const maxOverflow = Math.max(overflowR, overflowB, overflowL, overflowT);
      if (maxOverflow > opts.overflowTolerancePx) {
        samples.push({ sel: cssPath(child), overflow: Math.round(maxOverflow) + 'px' });
        if (samples.length >= 5) break;
      }
    }
    if (samples.length) {
      return { status: 'FAIL', actual: `${samples.length}+ overflows`, reason: 'descendants extend outside root bbox', samples };
    }
    return { status: 'PASS', actual: '0 overflows', reason: '' };
  }

  function check_layoutNotEngaged(root, opts) {
    // Heuristic: if root or a major child uses display: flex/grid AND the
    // children have a vertical-axis range > 8px when they should be horizontal
    // (or vice versa for column flex), the layout never engaged.
    // We only run this when the root itself is a flex/grid container.
    const cs = getComputedStyle(root);
    const isFlex = cs.display.includes('flex');
    const isGrid = cs.display.includes('grid');
    if (!isFlex && !isGrid) return { status: 'SKIP', reason: 'root is not flex/grid' };
    const dir = cs.flexDirection || 'row';
    const children = [...root.children].filter(isVisible);
    if (children.length < 2) return { status: 'SKIP', reason: 'fewer than 2 visible children' };
    const tops = children.map(c => bbox(c).y);
    const lefts = children.map(c => bbox(c).x);
    const yRange = Math.max(...tops) - Math.min(...tops);
    const xRange = Math.max(...lefts) - Math.min(...lefts);
    if (dir.startsWith('row') && yRange > 8) {
      return { status: 'FAIL', actual: `Y range ${Math.round(yRange)}px`, reason: 'flex-direction:row but children have vertical spread > 8px' };
    }
    if (dir.startsWith('column') && xRange > 8) {
      return { status: 'FAIL', actual: `X range ${Math.round(xRange)}px`, reason: 'flex-direction:column but children have horizontal spread > 8px' };
    }
    return { status: 'PASS', actual: `Y${Math.round(yRange)}/X${Math.round(xRange)}px range`, reason: '' };
  }

  // Minimal CSS path: tag + id + first class, walk up max 4 levels
  function cssPath(el) {
    const parts = [];
    let cur = el;
    for (let i = 0; i < 4 && cur && cur.nodeType === 1; i++) {
      let s = cur.tagName.toLowerCase();
      if (cur.id) s += '#' + cur.id;
      else if (cur.className && typeof cur.className === 'string') {
        const first = cur.className.split(/\s+/).filter(Boolean)[0];
        if (first) s += '.' + first;
      }
      parts.unshift(s);
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  }

  window.__sanityTier = function (opts) {
    opts = opts || {};
    const rootSelector = opts.rootSelector || 'body > *';
    const root = document.querySelector(rootSelector);
    if (!root) {
      return { error: `rootSelector "${rootSelector}" matched no element`, allPass: false };
    }
    const cfg = {
      isLayoutComponent: opts.isLayoutComponent !== false,
      minLayoutHeight: opts.minLayoutHeight || 50,
      overlapTolerancePx: opts.overlapTolerancePx ?? 1,
      overflowTolerancePx: opts.overflowTolerancePx ?? 2
    };
    const results = {
      'collapsed-root':     check_collapsedRoot(root, cfg),
      'text-collision':     check_textCollision(root, cfg),
      'child-overflow':     check_childOverflow(root, cfg),
      'layout-not-engaged': check_layoutNotEngaged(root, cfg)
    };
    const allPass = Object.values(results).every(r => r.status === 'PASS' || r.status === 'SKIP');
    return { rootSelector, config: cfg, results, allPass };
  };
})();
