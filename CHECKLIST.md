# Fortnightly market check

Runs on the 1st and 15th of every month (a scheduled Claude task), or by hand whenever you like.
Exchange rates are **not** part of this check — the "Update exchange rates" GitHub Action refreshes them every weekday.

## Ground rules

- Change a number only when the platform's or courier's **own page** (or a reputable news report quoting it) confirms it. Never guess.
- Every change gets a plain-English line at the top of `changelog` (newest first, keep at most 30).
- `checked.<section>` is set to today's date only when that section was actually verified — even if nothing changed. If a source couldn't be reached, leave that section's date alone.
- Keep every existing platform `id` and courier `id` (finds in the app refer to them). To retire a platform, keep it and say so in its `note`.
- Run `node scripts/validate.mjs` before committing. It must print ✓.

## 1. Platform fees → `platforms`, `checked.fees`

| id | What to confirm | Where |
|---|---|---|
| `yaga` | Seller fee (currently 0%) and buyer-protection fee; couriers offered | Yaga help centre / FAQ |
| `fbm` | Still free for local pickup in South Africa | Facebook Marketplace help |
| `ig` | No change expected (no platform fee) | — |
| `bob` | Category success fees and the per-item cap (`capZAR`, VAT-inclusive) | Bob Shop fees page |
| `depop_us` | US/UK selling fee, payment processing % + fixed, boosting fee; fee outside US/UK | Depop fees help page |
| `ebay` | Final value fee %, per-order fee, category exceptions (bags, jewellery, sneakers ≥ US$150) | eBay US selling fees page |
| `grailed` | Commission tiers (`pct`, `rules`, `minUSD`) and processing (`procPct`, `procFixedUSD`) | Grailed fees page |
| `poshmark` | Flat fee under US$15, % above | Poshmark fees page |
| `etsy` | Listing, transaction and processing fees (`pct` = transaction + processing %, `fixedUSD` = listing + processing fixed) | Etsy fees & payments policy |
| `vinted` | Seller fee (currently 0%) and buyer protection | Vinted help centre |

Fee fields: `pct` (% of sale), `fixedUSD` (per order), `cat` ({category: %} overrides), `rules` (list of `{cat?, minUSD?, maxUSD?, pct?, fixedUSD?, flatUSD?}` applied in order when the sale price in US$ is ≥ `minUSD` and < `maxUSD`), `minUSD` (minimum commission), `procPct` + `procFixedUSD` (payment processing). Update the `note` so people can read the fee in plain words.

## 2. Courier prices → `shipping`, `checked.shipping`

| id | Where |
|---|---|
| `paxi_std`, `paxi_fast`, `paxi_large`, `paxi_home` | paxi.co.za prices page |
| `pudo` | pudo.co.za (cheapest locker-to-locker "from" price) |

Prices are in rand (`zar`). Update `src.shipping` if the source changes.

## 3. Trends & colours → `trends`, `colours`, `facts`, `checked.trends`

- Sources: Depop's trending pages and trend reports, Vinted and Yaga trend posts, Google Trends (South Africa) for the trend keywords, reputable fashion/resale press.
- Keep 12–20 trends. Each has `n` (name), `heat` (0–100, how hot it is now), `mo` (momentum −2…+2: falling, flat, rising), `cats` (app categories), `k` (search keywords, lowercase), `src` (source and month).
- Remove trends that have clearly faded; add new ones only with a named source.
- `colours`: up to 6 currently rising colours with hex codes; set `src.colours`.
- `facts`: up to 5 short, sourced market facts (`t` text, `s` source). Replace outdated ones.
- Seasons matter: South Africa is in the Southern Hemisphere.

## 4. Finish

1. `node scripts/validate.mjs` → must show ✓
2. Set `updated` to today.
3. Commit as `Fortnightly market check YYYY-MM-DD` and push to `main`.

App categories: tops, bottoms, dresses, outerwear, knitwear, activewear, shoes, bags, accessories, jewellery, watches, home, toys, tech, media.
