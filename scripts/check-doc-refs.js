#!/usr/bin/env node
/**
 * check-doc-refs —— 已進版控的文件不得用 markdown 連結指向未進版控的檔案。
 *
 * 規則(見 doc/task-doc-tracking-policy.md):
 *   - **連結**  `[文字](path/to/file.md)`  → 目標必須已被 git 追蹤,否則 exit 1。
 *   - **引註**  散文裡的 `` `tasks/foo.md` `` → 不檢查。它可能指的是另一個 worktree
 *              的檔、或一段描述歷史的敘述(例:new_theme 分支上的原稿)。
 *
 * 這條分界是實測出來的:本樹 4 個「指向未追蹤檔」的引用**全部**是跨 worktree 引註或
 * 歷史敘述,一個真缺陷都沒有。用「連結才算」當判準,誤報是 0。
 *
 * 刻意**不**併進 `check:gate` —— gate 的數字是主題輸出的驗收,文件衛生不該混進去。
 *
 * `--selftest` 跑三個負向控制(在記憶體裡合成,不碰任何真檔):
 * 連結指向未追蹤檔要被抓、引註不得被抓、外部 URL 不得被抓。
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LINK = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)\s]*)?\)/g;

/**
 * 程式碼區塊與行內 code 裡的東西是**字面**,不是 markdown ——
 * 文件示範連結語法時寫的 `[文字](path)` 不該被當成真連結。
 * 換成等長的空白,行號與偏移量不受影響。
 */
function stripCode(text) {
	return text
		.replace(/```[\s\S]*?```/g, (m) => ' '.repeat(m.length))
		.replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
}

/**
 * @param docs   [[相對路徑, 內容], …]
 * @param tracked Set of 已追蹤的相對路徑
 * @param exists  (相對路徑) => boolean,用來分辨「存在但未追蹤」與「檔案不存在」
 * @param isDir   (相對路徑) => boolean,目錄要放行:git 從不追蹤目錄本身,
 *                所以「不在 ls-files 裡」對目錄而言不代表任何事
 */
function scan(docs, tracked, exists, isDir = () => false) {
	const violations = [];
	let linksChecked = 0;
	for (const [doc, raw] of docs) {
		const text = stripCode(raw);
		for (const m of text.matchAll(LINK)) {
			const target = m[1];
			// 外部連結與純錨點不在範圍內
			if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
			linksChecked++;
			// 尾斜線要剝掉:`../contracts/` 正規化後是 `contracts/`,
			// 而 git ls-files 的條目永遠沒有尾斜線 —— 不剝就永遠比不中
			const resolved = path
				.normalize(path.join(path.dirname(doc), target))
				.replace(/\/+$/, '');
			// 指到 repo 之外(例:../zkThemeTemplate 的 Marble 樹)不歸本檢查管
			if (resolved.startsWith('..')) continue;
			if (tracked.has(resolved)) continue;
			if (isDir(resolved)) continue;
			violations.push({
				doc, target, resolved,
				why: exists(resolved) ? '存在但未進版控' : '檔案不存在',
			});
		}
	}
	return { violations, linksChecked };
}

function selftest() {
	const tracked = new Set(['doc/a.md', 'tasks/kept.md']);
	const cases = [
		['連結指向未追蹤檔 → 必須抓到',
			[['doc/a.md', 'see [x](../tasks/loose.md)']], 1],
		['引註(非連結)→ 不得抓',
			[['doc/a.md', 'see `tasks/loose.md` for detail']], 0],
		['外部 URL → 不得抓',
			[['doc/a.md', '[zk](https://www.zkoss.org/x.md)']], 0],
		['連結指向已追蹤檔 → 不得抓',
			[['doc/a.md', 'see [k](../tasks/kept.md)']], 0],
		['指到 repo 之外 → 不得抓',
			[['doc/a.md', 'see [m](../../zkThemeTemplate/tasks/x.md)']], 0],
		// git 從不追蹤目錄,所以目錄一定不在 ls-files 裡 —— 不放行就是保證誤報
		['連結指向目錄 → 不得抓',
			[['doc/a.md', 'see [d](../contracts/)']], 0, (p) => p === 'contracts'],
		// 文件在示範連結語法,不是真的在連結(這條是本檢查自己踩到的)
		['行內 code 裡的連結語法 → 不得抓',
			[['doc/a.md', '寫成 `[文字](../tasks/foo.md)` 就是連結']], 0],
		['fenced block 裡的連結語法 → 不得抓',
			[['doc/a.md', '```md\n[x](../tasks/foo.md)\n```']], 0],
	];
	let failed = 0;
	for (const [name, docs, expect, isDir] of cases) {
		const got = scan(docs, tracked, () => true, isDir).violations.length;
		const ok = got === expect;
		if (!ok) failed++;
		console.log(`  ${ok ? '✓' : '✗'} ${name}  (預期 ${expect}, 實得 ${got})`);
	}
	if (failed) {
		console.error(`\n✗ selftest: ${failed} 項不符`);
		process.exit(1);
	}
	console.log(`✓ selftest: ${cases.length} 項全過`);
}

if (process.argv.includes('--selftest')) {
	selftest();
	process.exit(0);
}

const ROOT = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
const tracked = new Set(
	execSync('git ls-files', { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 })
		.split('\n').filter(Boolean)
);

// 只掃 markdown —— 連結語法是 markdown 專有的
const docs = [...tracked]
	.filter((f) => f.endsWith('.md'))
	.map((f) => [f, fs.readFileSync(path.join(ROOT, f), 'utf8')]);

const { violations, linksChecked } = scan(
	docs, tracked,
	(rel) => fs.existsSync(path.join(ROOT, rel)),
	(rel) => {
		try {
			return fs.statSync(path.join(ROOT, rel)).isDirectory();
		} catch {
			return false;
		}
	}
);

console.log(`check-doc-refs: ${docs.length} 個已追蹤的 .md,檢查 ${linksChecked} 條連結`);

if (violations.length) {
	console.error(`\n✗ ${violations.length} 條連結指向未追蹤的目標:\n`);
	for (const v of violations) {
		console.error(`  ${v.doc}`);
		console.error(`    → ${v.target}  (${v.why}: ${v.resolved})`);
	}
	console.error(
		'\n修法二選一:把目標加進版控(它被引用,代表它裝著別人依賴的東西),\n' +
		'或者把連結改成引註(拿掉 markdown 連結語法),表示它不是本 repo 的檔。\n'
	);
	process.exit(1);
}

console.log('✓ 每一條連結的目標都在版控裡');
