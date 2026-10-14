// Refreshes the exchange rates in market.json from the European Central Bank reference rates
// (served free, with no API key, by the Frankfurter API). Runs every weekday in GitHub Actions.
// Refuses implausible values or a jump of more than 15% in one go, so one bad response can't break prices in the app.
import fs from 'node:fs';

const FILE = 'market.json';
const URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=ZAR,GBP,EUR';
const m = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const res = await fetch(URL, { headers: { 'User-Agent': 'cyber-thrift-statistic- (github.com/MagicallyPressure/cyber-thrift-statistic-)' } });
if (!res.ok) throw new Error(`Frankfurter replied ${res.status}`);
const j = await res.json();
const r = j.rates || {};
const ok = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
if (!/^\d{4}-\d{2}-\d{2}$/.test(j.date || '') || !ok(r.ZAR, 5, 60) || !ok(r.GBP, 0.3, 2) || !ok(r.EUR, 0.3, 2)) throw new Error('Unexpected response: ' + JSON.stringify(j).slice(0, 200));

for (const c of ['ZAR', 'GBP', 'EUR']) {
  const old = m.fx?.[c];
  if (old && Math.abs(r[c] - old) / old > 0.15) throw new Error(`${c} moved ${(100 * (r[c] - old) / old).toFixed(1)}% in one update — refusing; check by hand`);
}
const fx = { ZAR: +r.ZAR.toFixed(4), GBP: +r.GBP.toFixed(5), EUR: +r.EUR.toFixed(5) };
if (JSON.stringify(fx) === JSON.stringify(m.fx) && m.checked.fx === j.date) { console.log(`No change (rates for ${j.date}).`); process.exit(0); }

m.fx = fx;
m.checked.fx = j.date;
if (j.date > m.updated) m.updated = j.date;
fs.writeFileSync(FILE, JSON.stringify(m, null, 1) + '\n');
console.log(`Updated rates for ${j.date}: US$1 = R${fx.ZAR} · £${fx.GBP} · €${fx.EUR}`);
