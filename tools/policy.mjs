#!/usr/bin/env node
// Privacy policy versions. Every policy lives in privacy/<name>/: index.html
// is the version in effect, and <YYYY-MM-DD>.html is each earlier version,
// named by the date it took effect. Old versions are never deleted.
//
//   node tools/policy.mjs list
//   node tools/policy.mjs new <name> <YYYY-MM-DD> "What changed"
//   node tools/policy.mjs check
//
// `new` archives the current version, moves index.html to the new date, adds
// a row to its "Changes and past versions" table and updates privacy/index.html
// and sitemap.xml. Then edit privacy/<name>/index.html to say what changed.
// `check` validates every policy and exits non-zero on any problem.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PRIVACY = join(ROOT, "privacy");
const HUB = join(PRIVACY, "index.html");
const SITEMAP = join(ROOT, "sitemap.xml");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const read = (p) => readFileSync(p, "utf8");
const human = (iso) => { const [y, m, d] = iso.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
const dayBefore = (iso) => { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const plural = (n) => `${n} version${n === 1 ? "" : "s"}`;

const EFFECTIVE = /<time class="effective" datetime="(\d{4}-\d{2}-\d{2})">Effective [^<]+<\/time>/;

function fail(msg) { console.error(`error: ${msg}`); process.exit(1); }

function policies() {
	return readdirSync(PRIVACY)
		.filter((n) => statSync(join(PRIVACY, n)).isDirectory() && existsSync(join(PRIVACY, n, "index.html")))
		.sort();
}

function archives(name) {
	return readdirSync(join(PRIVACY, name)).filter((f) => DATE.test(f.replace(/\.html$/, "")) && f.endsWith(".html")).map((f) => f.slice(0, 10)).sort();
}

function effective(html, file) {
	const m = html.match(EFFECTIVE);
	if (!m) fail(`${file}: no <time class="effective" datetime="YYYY-MM-DD"> found`);
	return m[1];
}

function list() {
	for (const name of policies()) {
		const html = read(join(PRIVACY, name, "index.html"));
		const past = archives(name);
		console.log(`${name.padEnd(22)} effective ${effective(html, name)}   ${plural(past.length + 1)}${past.length ? `   past: ${past.join(", ")}` : ""}`);
	}
}

function newVersion(name, date, summary) {
	if (!name || !date || !summary) fail('usage: node tools/policy.mjs new <name> <YYYY-MM-DD> "What changed"');
	if (!DATE.test(date) || isNaN(Date.parse(date))) fail(`${date} is not a YYYY-MM-DD date`);
	const dir = join(PRIVACY, name);
	const indexPath = join(dir, "index.html");
	if (!existsSync(indexPath)) fail(`privacy/${name}/index.html does not exist (policies: ${policies().join(", ")})`);

	const html = read(indexPath);
	const old = effective(html, indexPath);
	if (date <= old) fail(`the new date ${date} must be after the current effective date ${old}`);
	const archivePath = join(dir, `${old}.html`);
	if (existsSync(archivePath)) fail(`privacy/${name}/${old}.html already exists`);

	// 1. The archived copy: not indexed, not canonical, marked as old.
	let archive = html
		.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">')
		.replace(/\n<link rel="canonical"[^>]*>/, "")
		.replace(/<title>([^<]*)<\/title>/, `<title>$1 (${human(old)} version)</title>`)
		.replace(/(<p class="crumbs">.*?)\s*\/\s*([^<\/]+)<\/p>/, `$1 / <a href="/privacy/${name}">$2</a> / ${human(old)}</p>`)
		.replace(/(<p><time class="effective"[^\n]*<\/p>)/,
			`$1\n\t\t\t<div class="archived" role="note"><strong>This is an old version of this policy.</strong> It was in effect from ${human(old)} to ${human(dayBefore(date))}. <a href="/privacy/${name}">Read the current policy</a>.</div>`);
	if (!archive.includes('class="archived"')) fail("could not insert the archived notice");
	writeFileSync(archivePath, archive);

	// 2. The current page: new date, and a new row on top of the history.
	let current = html.replace(EFFECTIVE, `<time class="effective" datetime="${date}">Effective ${human(date)}</time>`);
	const row = /<tr data-current><td>[^<]*\(this version\)<\/td>/;
	if (!row.test(current)) fail(`${indexPath}: no <tr data-current> row in the versions table`);
	current = current.replace(row, `<tr><td><a href="/privacy/${name}/${old}.html">${human(old)}</a></td>`);
	current = current.replace(/(<tbody data-versions>\n?)(\s*)/, `$1$2<tr data-current><td>${human(date)} (this version)</td><td>${escape(summary)}</td></tr>\n$2`);
	writeFileSync(indexPath, current);

	// 3. The hub and the sitemap.
	const count = archives(name).length + 1;
	let hub = read(HUB);
	hub = hub.replace(new RegExp(`<time data-policy="${name}" datetime="[^"]*">[^<]*</time>`), `<time data-policy="${name}" datetime="${date}">${human(date)}</time>`);
	hub = hub.replace(new RegExp(`<span data-count="${name}">[^<]*</span>`), `<span data-count="${name}">${plural(count)}</span>`);
	writeFileSync(HUB, hub);
	if (existsSync(SITEMAP)) {
		const sm = read(SITEMAP).replace(new RegExp(`(<loc>[^<]*/privacy/${name}/</loc>\\s*<lastmod>)[^<]*`), `$1${date}`);
		writeFileSync(SITEMAP, sm);
	}

	console.log(`archived  privacy/${name}/${old}.html (in effect ${old} to ${dayBefore(date)})`);
	console.log(`updated   privacy/${name}/index.html, now effective ${date}`);
	console.log(`updated   privacy/index.html${existsSync(SITEMAP) ? " and sitemap.xml" : ""}`);
	console.log(`\nNow edit privacy/${name}/index.html with the new wording, then run: node tools/policy.mjs check`);
}

function check() {
	const problems = [];
	const hub = read(HUB);
	for (const name of policies()) {
		const dir = join(PRIVACY, name);
		const rel = (f) => `privacy/${name}/${f}`;
		const html = read(join(dir, "index.html"));
		const m = html.match(EFFECTIVE);
		if (!m) { problems.push(`${rel("index.html")}: missing effective date`); continue; }
		const current = m[1];
		const past = archives(name);

		if (/name="robots" content="noindex"/.test(html)) problems.push(`${rel("index.html")}: the current version must not be noindex`);
		if (html.includes('class="archived"')) problems.push(`${rel("index.html")}: the current version carries the archived notice`);
		if ((html.match(/<tr data-current>/g) || []).length !== 1) problems.push(`${rel("index.html")}: needs exactly one <tr data-current> row`);
		const cur = html.match(/<tr data-current><td>([^<]*) \(this version\)/);
		if (cur && cur[1] !== human(current)) problems.push(`${rel("index.html")}: table says ${cur[1]} but the page is effective ${human(current)}`);

		const linked = [...html.matchAll(new RegExp(`<a href="/privacy/${name}/(\\d{4}-\\d{2}-\\d{2})\\.html">`, "g"))].map((x) => x[1]);
		for (const d of linked) if (!past.includes(d)) problems.push(`${rel("index.html")}: links ${d}.html, which does not exist`);
		for (const d of past) if (!linked.includes(d)) problems.push(`${rel("index.html")}: ${d}.html is not listed in the versions table`);

		const dates = [...past, current];
		past.forEach((d, i) => {
			const a = read(join(dir, `${d}.html`));
			const until = dayBefore(dates[i + 1]);
			if (!/name="robots" content="noindex"/.test(a)) problems.push(`${rel(d + ".html")}: missing noindex`);
			if (/rel="canonical"/.test(a)) problems.push(`${rel(d + ".html")}: an old version must not be canonical`);
			const e = a.match(EFFECTIVE);
			if (!e || e[1] !== d) problems.push(`${rel(d + ".html")}: effective date does not match the file name`);
			if (!a.includes(`in effect from ${human(d)} to ${human(until)}`)) problems.push(`${rel(d + ".html")}: archived notice should read "in effect from ${human(d)} to ${human(until)}"`);
		});
		if (current <= (past.at(-1) ?? "")) problems.push(`privacy/${name}: current date ${current} is not after the last archive`);

		const h = hub.match(new RegExp(`<time data-policy="${name}" datetime="([^"]*)">([^<]*)</time>`));
		if (!h) problems.push(`privacy/index.html: no <time data-policy="${name}">`);
		else if (h[1] !== current || h[2] !== human(current)) problems.push(`privacy/index.html: ${name} shows ${h[1]} but the policy is effective ${current}`);
		const c = hub.match(new RegExp(`<span data-count="${name}">([^<]*)</span>`));
		if (c && c[1] !== plural(dates.length)) problems.push(`privacy/index.html: ${name} says "${c[1]}", expected "${plural(dates.length)}"`);
	}
	if (problems.length) { for (const p of problems) console.error(`✗ ${p}`); process.exit(1); }
	console.log(`✓ ${policies().length} policies, all versions consistent`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "list") list();
else if (cmd === "new") newVersion(...args);
else if (cmd === "check") check();
else fail("usage: node tools/policy.mjs list | new <name> <YYYY-MM-DD> \"What changed\" | check");
