const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function calculate(order) {
  const { items, coupon } = order;
  const checkout = pricing.computeTotals(items, coupon);
  const { rows, ...invoiceTotals } = invoice.computeInvoiceFigures(order);
  return { checkout, invoiceTotals, rows };
}

function invoiceLineTaxes(rows) {
  return rows.map(({ hsn, gstPercent, lineTax }) => ({ hsn, gstPercent, lineTax }));
}

test('#1001-style invoice uses the 12% and 5% HSN slabs', () => {
  const order = {
    id: 1001,
    coupon: '',
    items: [
      { name: 'Ghee', price: 140, qty: 2, hsn: '0405' },
      { name: 'Dal', price: 165, qty: 2, hsn: '0713' }
    ]
  };
  const { checkout, invoiceTotals, rows } = calculate(order);

  assert.deepEqual(checkout.lines.map(line => line.gstPercent), [12, 5]);
  assert.equal(checkout.tax, 50.10);
  assert.equal(checkout.total, 660.10);
  assert.deepEqual(invoiceTotals, {
    subtotal: 610, discount: 0, tax: 50.10, cgst: 25.05, sgst: 25.05, total: 660.10
  });
  assert.deepEqual(invoiceLineTaxes(rows), [
    { hsn: '0405', gstPercent: 12, lineTax: 33.60 },
    { hsn: '0713', gstPercent: 5, lineTax: 16.50 }
  ]);
});

test('#1002-style invoice applies SAVE10 before GST', () => {
  const order = {
    id: 1002,
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 640, qty: 1, hsn: '1006' },
      { name: 'Sunflower oil', price: 190, qty: 2, hsn: '1512' }
    ]
  };
  const { checkout, invoiceTotals, rows } = calculate(order);

  assert.equal(checkout.discount, 102);
  assert.equal(checkout.tax, 45.90);
  assert.equal(checkout.total, 963.90);
  assert.deepEqual(invoiceTotals, {
    subtotal: 1020, discount: 102, tax: 45.90, cgst: 22.95, sgst: 22.95, total: 963.90
  });
  assert.deepEqual(invoiceLineTaxes(rows), [
    { hsn: '1006', gstPercent: 5, lineTax: 28.80 },
    { hsn: '1512', gstPercent: 5, lineTax: 17.10 }
  ]);
});

test('#1004-style invoice honors the ₹150 SAVE10 cap', () => {
  const order = {
    id: 1004,
    coupon: 'SAVE10',
    items: [{ name: 'Groundnut oil', price: 1120, qty: 2, hsn: '1508' }]
  };
  const { checkout, invoiceTotals, rows } = calculate(order);

  assert.equal(checkout.subtotal, 2240);
  assert.equal(checkout.discount, 150);
  assert.equal(checkout.tax, 104.50);
  assert.equal(checkout.total, 2194.50);
  assert.deepEqual(invoiceTotals, {
    subtotal: 2240, discount: 150, tax: 104.50, cgst: 52.25, sgst: 52.25, total: 2194.50
  });
  assert.deepEqual(invoiceLineTaxes(rows), [
    { hsn: '1508', gstPercent: 5, lineTax: 104.50 }
  ]);
});

test('CURRENT BEHAVIOUR: #1008-style 18% items without a coupon match checkout', () => {
  const order = {
    id: 1008,
    coupon: '',
    items: [
      { name: 'Tea', price: 140, qty: 1, hsn: '0902' },
      { name: 'Syrup', price: 180, qty: 2, hsn: '2106', gstRate: 18 }
    ]
  };
  const { checkout, invoiceTotals, rows } = calculate(order);
  const { taxable, lines, ...checkoutTotals } = checkout;

  assert.deepEqual(invoiceTotals, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590
  });
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineTaxes(rows), [
    { hsn: '0902', gstPercent: 18, lineTax: 25.20 },
    { hsn: '2106', gstPercent: 18, lineTax: 64.80 }
  ]);
});

test('invoice matches checkout for a capped coupon across GST slabs', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      { name: 'Rice', price: 1000, qty: 1, hsn: '1006' },
      { name: 'Ghee', price: 1000, qty: 1, hsn: '0405' }
    ]
  };
  const { checkout, invoiceTotals, rows } = calculate(order);
  const { taxable, lines, ...checkoutTotals } = checkout;

  assert.equal(checkout.discount, 150);
  assert.deepEqual(invoiceTotals, checkoutTotals);
  assert.deepEqual(invoiceLineTaxes(rows), [
    { hsn: '1006', gstPercent: 5, lineTax: 46.25 },
    { hsn: '0405', gstPercent: 12, lineTax: 111 }
  ]);
  assert.equal(invoiceTotals.total, 2007.25);
});
