// Checks market.json before it goes live. The app runs the same range checks and ignores anything that fails,
// so this script exists to catch mistakes early (in GitHub Actions and before every manual or Claude update).
// Usage: node scripts/validate.mjs [path/to/market.json]
import fs from 'node:fs';

const file = process.argv[2] || 'market.json';
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);

const CATS = ['tops', 'bottoms', 'dresses', 'outerwear', 'knitwear', 'activewear', 'shoes', 'bags', 'accessories', 'jewellery', 'watches', 'home', 'toys', 'tech', 'media'];
const GROUPS = ['garment', 'shoes', 'bags', 'acc', 'jewel', 'home', 'toys', 'tech', 'media'];
const CORE_PLATFORMS = ['yaga', 'fbm', 'ig', 'bob', 'depop_us', 'ebay', 'grailed', 'poshmark', 'etsy', 'vinted'];
const today = new Date().toISOString().slice(0, 10);
const isNum = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const isDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && v >= '2020-01-01' && (Date.parse(v) - Date.parse(today)) / 864e5 <= 1;
const isStr = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[<>]/.test(v);
const isId = v => typeof v === 'string' && /^[a-z0-9_]{1,24}$/.test(v);

let m;
try { m = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.error(`✗ ${file} is not valid JSON: ${e.message}`); process.exit(1); }

if (m.schema !== 1) err('schema must be 1');
if (!isDate(m.updated)) err('updated must be a YYYY-MM-DD date, not in the future');
for (const k of ['fx', 'fees', 'shipping', 'trends']) if (!isDate(m.checked?.[k])) err(`checked.${k} must be a YYYY-MM-DD date, not in the future`);
for (const k of ['fx', 'fees', 'shipping', 'trends', 'colours']) if (m.src?.[k] != null && !isStr(m.src[k], 120)) err(`src.${k} must be text up to 120 characters`);

if (!(isNum(m.fx?.ZAR, 5, 60) && isNum(m.fx?.GBP, 0.3, 2) && isNum(m.fx?.EUR, 0.3, 2))) err('fx needs ZAR (5–60), GBP (0.3–2) and EUR (0.3–2), each per US$1');

if (!Array.isArray(m.platforms) || !m.platforms.length) err('platforms must be a non-empty list');
else {
  const ids = new Set();
  m.platforms.forEach((p, i) => {
    const at = `platforms[${i}] (${p?.id || '?'})`;
    if (!isId(p?.id)) return err(`${at}: id must be lowercase letters, numbers or _`);
    if (ids.has(p.id)) err(`${at}: duplicate id`); ids.add(p.id);
    if (!isStr(p.n, 60)) err(`${at}: n (name) must be text up to 60 characters`);
    if (!['SA', 'INTL'].includes(p.r)) err(`${at}: r must be "SA" or "INTL"`);
    if (p.note != null && !(typeof p.note === 'string' && p.note.length <= 400 && !/[<>]/.test(p.note))) err(`${at}: note must be text up to 400 characters, no < or >`);
    if (p.id === 'bob') { if (p.pct !== null) err(`${at}: Bob Shop pct must be null (the user enters their category fee)`); if (p.capZAR != null && !isNum(p.capZAR, 0, 1e6)) err(`${at}: capZAR out of range`); }
    else if (!isNum(p.pct, 0, 60)) err(`${at}: pct must be a number from 0 to 60`);
    for (const [k, lo, hi] of [['fixedUSD', 0, 20], ['minUSD', 0, 50], ['procPct', 0, 15], ['procFixedUSD', 0, 5]]) if (p[k] != null && !isNum(p[k], lo, hi)) err(`${at}: ${k} must be ${lo}–${hi}`);
    if (p.cat != null) for (const [k, v] of Object.entries(p.cat)) { if (!CATS.includes(k)) warn(`${at}: cat.${k} is not an app category (ignored by the app)`); if (!isNum(v, 0, 60)) err(`${at}: cat.${k} must be 0–60`); }
    if (p.rules != null) {
      if (!Array.isArray(p.rules) || p.rules.length > 6) err(`${at}: rules must be a list of up to 6`);
      else p.rules.forEach((r, j) => {
        if (r.cat != null && !CATS.includes(r.cat)) err(`${at}: rules[${j}].cat must be an app category`);
        for (const [k, lo, hi] of [['minUSD', 0, 1e6], ['maxUSD', 0, 1e6], ['pct', 0, 60], ['fixedUSD', 0, 20], ['flatUSD', 0, 100]]) if (r[k] != null && !isNum(r[k], lo, hi)) err(`${at}: rules[${j}].${k} must be ${lo}–${hi}`);
      });
    }
    if (p.aff != null) for (const [k, v] of Object.entries(p.aff)) { if (!GROUPS.includes(k)) warn(`${at}: aff.${k} is not a category group`); if (!isNum(v, 0, 2)) err(`${at}: aff.${k} must be 0–2`); }
  });
  for (const id of CORE_PLATFORMS) if (!ids.has(id)) warn(`platform "${id}" is missing — the app will keep its built-in entry`);
}

if (!Array.isArray(m.shipping) || !m.shipping.length) err('shipping must be a non-empty list');
else m.shipping.forEach((s, i) => { if (!isId(s?.id) || !isStr(s?.n, 80) || !isNum(s?.zar, 0, 5000)) err(`shipping[${i}] needs id, n (name) and zar (0–5000)`); });

if (!Array.isArray(m.trends) || m.trends.length < 3) err('trends must list at least 3 trends');
else m.trends.forEach((t, i) => {
  const at = `trends[${i}] (${t?.n || '?'})`;
  if (!isStr(t?.n, 80)) err(`${at}: n must be text up to 80 characters`);
  if (!isNum(t?.heat, 0, 100)) err(`${at}: heat must be 0–100`);
  if (!isNum(t?.mo, -5, 5)) err(`${at}: mo (momentum) must be -5 to 5`);
  if (!Array.isArray(t?.cats) || !t.cats.some(c => CATS.includes(c))) err(`${at}: cats needs at least one app category`);
  else t.cats.filter(c => !CATS.includes(c)).forEach(c => warn(`${at}: category "${c}" is ignored`));
  if (t?.k != null && !(typeof t.k === 'string' && t.k.length <= 200)) err(`${at}: k (keywords) must be text up to 200 characters`);
  if (!isStr(t?.src, 120)) warn(`${at}: add a src so people can see where the trend came from`);
});
if (m.colours != null) (Array.isArray(m.colours) ? m.colours : [null]).forEach((c, i) => { if (!isStr(c?.n, 40) || !/^#[0-9a-f]{6}$/i.test(c?.hex || '')) err(`colours[${i}] needs n and a #rrggbb hex`); });
if (m.facts != null) (Array.isArray(m.facts) ? m.facts : [null]).forEach((f, i) => { if (!isStr(f?.t, 300)) err(`facts[${i}].t must be text up to 300 characters`); if (!isStr(f?.s, 120)) warn(`facts[${i}] has no source (s)`); });
if (m.changelog != null) {
  if (!Array.isArray(m.changelog) || m.changelog.length > 30) err('changelog must be a list of up to 30 entries (newest first)');
  else m.changelog.forEach((c, i) => { if (!isDate(c?.d) || !isStr(c?.t, 300)) err(`changelog[${i}] needs d (date) and t (text up to 300 characters)`); if (i && c?.d > m.changelog[i - 1]?.d) warn('changelog should be newest first'); });
}
if (JSON.stringify(m).length > 200000) err('market.json is larger than 200 KB — the app will reject it');

warnings.forEach(w => console.log('! ' + w));
if (errors.length) { errors.forEach(e => console.error('✗ ' + e)); console.error(`\n${errors.length} problem(s) — the app would ignore the broken parts. Fix before pushing.`); process.exit(1); }
console.log(`✓ ${file} OK — ${m.platforms.length} platforms, ${m.shipping.length} courier prices, ${m.trends.length} trends · rates ${m.checked.fx}, fees ${m.checked.fees}, couriers ${m.checked.shipping}, trends ${m.checked.trends}`);
