// api/checkout.js — creates a Stripe Checkout session for the bag.
//
// Prices live HERE, on the server, not in the browser. Whatever the page
// sends, the amount charged comes from this table — so nobody can edit a
// price in their browser and pay $1 for a necklace.
//
// Keep this list in step with the PRODUCTS list in index.html.
// Amounts are in cents: $30.00 = 3000.

const Stripe = require('stripe');

const CATALOG = {
  hrt: { name: 'White heart cord necklace',   price: 4000 },
  blu: { name: 'Blue cord heart necklace',    price: 4000 },
  nvy: { name: 'Navy seed bead necklace',     price: 2000 },
  grf: { name: 'Green fish necklace',         price: 2000 },
  grn: { name: 'Green & red beaded necklace', price: 3000 },
  mlt: { name: 'Color block necklace',        price: 3000 },
  crd: { name: 'Red cord charm necklace',     price: 3500 },
  amb: { name: 'Amber fish bracelet',         price: 2500 },
  lem: { name: 'Lemon fish bracelet',         price: 2500 },
  pb:  { name: 'Paracord bracelet',           price: 1000 },
  phn: { name: 'Paracord heart necklace',     price: 4000 }
};

// Flat shipping. Set to null to collect no shipping and charge items only.
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

    const line_items = items
      .filter(i => CATALOG[i.id])
      .slice(0, 20)
      .map(i => ({
        quantity: Math.min(Math.max(parseInt(i.qty, 10) || 1, 1), 10),
        price_data: {
          currency: 'usd',
          unit_amount: CATALOG[i.id].price,
          product_data: { name: CATALOG[i.id].name }
        }
      }));

    if (!line_items.length) {
      return res.status(400).json({ error: 'Nothing valid in the bag' });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      // Stripe shows card, Apple Pay, Google Pay and Link automatically
      // for whatever the buyer's device supports.
      automatic_tax: { enabled: false },
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
    console.error('Stripe checkout failed:', err.message);
    return res.status(500).json({ error: 'Could not start checkout' });
  }
};
