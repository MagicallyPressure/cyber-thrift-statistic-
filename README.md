# CyberThrift market data

The live market numbers for the **CyberThrift** reseller app: exchange rates, platform fees, courier prices, resale trends and market facts.
The app downloads `market.json` when it's online (at most twice a day) and keeps working offline with the last good copy.

| What | How often | Who updates it |
|---|---|---|
| Exchange rates (ZAR, GBP, EUR per US$1) | Every weekday | GitHub Action → European Central Bank rates via the free [Frankfurter API](https://frankfurter.dev) |
| Platform fees | Every two weeks (1st & 15th) | Scheduled Claude check — see [CHECKLIST.md](CHECKLIST.md) |
| Courier prices (PAXI, Pudo) | Every two weeks | Scheduled Claude check |
| Trends, colours, market facts | Every two weeks | Scheduled Claude check |

Everything here is free: the repo is public, so GitHub Actions and file hosting cost nothing, and the rates API needs no key.

## Safety

- The app checks every value against fixed ranges and ignores anything out of range or malformed, falling back to the data built into the app.
- The rate updater refuses a move of more than 15% in one update.
- `scripts/validate.mjs` runs on every change (the **Check market data** workflow). A red ✗ there means the app would ignore the broken part.

## Editing by hand

1. Open `market.json` on GitHub and tap the pencil icon.
2. Change the value, set the matching `checked` date to today (YYYY-MM-DD) and add a line at the top of `changelog`.
3. Commit. The **Check market data** workflow tells you within a minute if something is wrong.

Phones pick up the change the next time the app checks (within 12 hours, or straight away with **Market → Check now**).

## File layout

```
schema     always 1
updated    date of the last change
checked    { fx, fees, shipping, trends } — date each section was last verified
src        { fx, fees, shipping, trends, colours } — where the numbers come from
fx         { ZAR, GBP, EUR } — local currency per US$1
platforms  [ { id, n, r: "SA"|"INTL", note, pct, fixedUSD, cat, rules, minUSD, procPct, procFixedUSD, capZAR, aff } ]
shipping   [ { id, n, zar } ]
trends     [ { n, heat 0–100, mo −5…5, cats, k, src } ]
colours    [ { n, hex } ]
facts      [ { t, s } ]
changelog  [ { d, t } ] newest first
```

Platform and courier entries are matched to the app's built-in ones by `id`, so a field left out keeps the app's built-in value. To clear a list such as `rules`, set it to `[]`.
