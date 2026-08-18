// Creates a Stripe Checkout session for the bag.
//
// Prices come from the stored catalogue on the server, never from the browser.
// Whatever the page sends, the amount charged is looked up here — so nobody
// can edit a price in their browser and pay $1 for a necklace. It is also the
// same list the admin edits, so the site and the charge can never disagree.

const Stripe = require('stripe');
const { priceTable } = require('./_lib/store');

// Flat shipping in cents. Set SHIPPING to null to collect no shipping.
const SHIPPING = { label: 'Shipping', amount: 500 };

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not set');
    return res.status(500).json({ error: 'Checkout is not configured yet' });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { items = [], note = '' } = req.body || {};
    const catalog = await priceTable();

    const line_items = [];
    for (const i of items.slice(0, 20)) {
      const entry = catalog[i.id];
      if (!entry) continue;
      if (!entry.inStock) return res.status(409).json({ error: `${entry.name} has just sold` });
      line_items.push({
        quantity: Math.min(Math.max(parseInt(i.qty, 10) || 1, 1), 10),
        price_data: {
          currency: 'usd',
          unit_amount: entry.price,
          product_data: { name: entry.name }
        }
      });
    }

    if (!line_items.length) return res.status(400).json({ error: 'Nothing valid in the bag' });

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      // Stripe shows card, Apple Pay, Google Pay and Link automatically,
      // depending on what the buyer's device supports.
      shipping_address_collection: { allowed_countries: ['US'] },
      shipping_options: SHIPPING ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: SHIPPING.label,
          fixed_amount: { amount: SHIPPING.amount, currency: 'usd' }
        }
      }] : undefined,
      phone_number_collection: { enabled: true },
      metadata: { note: String(note).slice(0, 450) },
      success_url: `${origin}/?paid=1`,
      cancel_url: origin
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('checkout:', err.message);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};
