# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser for JSON requests.
The browser UI uses plain HTML, CSS, and JavaScript in `public/`.
`server.js` serves the UI, mounts the API at `/api`, and serves printable invoices.
`config.js` holds shop settings, GST slabs, and coupon rules. App data lives in `data/db.json`.

## Module map

- `routes/customers.js` — Lists Khata customers and settlements and records settlement payments.
- `routes/orders.js` — Lists, retrieves, places, and cancels orders.
- `routes/products.js` — Lists products with stock and GST details, and lists active coupons.
- `routes/reports.js` — Serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` — Normalizes coupon codes, checks eligibility, and calculates discounts.
- `lib/dates.js` — Formats local dates and provides date normalization and fiscal-year helpers.
- `lib/inventory.js` — Looks up products, checks sellable quantities, deducts stock, releases reservations, and summarizes inventory.
- `lib/invoice.js` — Recalculates invoice figures and renders printable HTML.
- `lib/ledger.js` — Tracks Khata balances, charges and reversals, and settlement payments.
- `lib/orders.js` — Creates, retrieves, filters, and cancels order records.
- `lib/pricing.js` — Allocates coupon discounts across lines and calculates checkout GST and totals.
- `lib/reports.js` — Aggregates dashboard figures and compares saved orders with recalculated invoice figures.
- `lib/store.js` — Reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` — Resolves item GST rates and splits GST into CGST and SGST.

## Commands

- Start the app from the repo root with `node server.js`.
- Run tests from the repo root with `node --test`. The package's `npm test` script is a failing placeholder.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the module or modules the ticket is about.
3. Tests must use in-memory data and never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The invoice total and GST breakdown do not match what the customer was billed.
Checkout applies HSN rates to discounted line amounts. The invoice recalculates GST on gross lines and recalculates the coupon separately.
Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
