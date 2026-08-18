// Admin: sales figures, pulled live from Stripe.
//
// Nothing about orders is stored on this site — Stripe already holds every
// completed sale, so it is the single source of truth. That means the numbers
// here can never drift out of step with the money that actually arrived.

const { requireAdmin } = require('../_lib/auth');
const Stripe = require('stripe');

const money = cents => Math.round(cents) / 100;

module.exports = requireAdmin(async (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(200).json({ configured: false, message: 'Stripe key not set' });
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const days = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 90));
    const since = Math.floor(Date.now() / 1000) - days * 86400;

    // Completed checkouts only — abandoned carts are not sales.
    const sessions = [];
    for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
      if (s.payment_status === 'paid') sessions.push(s);
      if (sessions.length >= 500) break;
    }

    const paid = sessions.filter(s => (s.amount_total || 0) > 0);
    const gross = paid.reduce((n, s) => n + (s.amount_total || 0), 0);
    const shippingTotal = paid.reduce(
      (n, s) => n + ((s.total_details && s.total_details.amount_shipping) || 0), 0);
    const orders = paid.length;

    // Stripe's own cut, so the net figure is what actually lands in the bank.
    const fees = Math.round(gross * 0.029 + orders * 30);

    // Per-day series for the chart
    const byDay = {};
    for (const s of paid) {
      const d = new Date(s.created * 1000).toISOString().slice(0, 10);
      byDay[d] = byDay[d] || { date: d, revenue: 0, orders: 0 };
      byDay[d].revenue += s.amount_total || 0;
      byDay[d].orders += 1;
    }
    const series = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, revenue: money(d.revenue) }));

    // Which pieces actually sell. Line items need a call each, so cap it.
    const unitsByItem = {};
    for (const s of paid.slice(0, 60)) {
      try {
        const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 20 });
        for (const li of items.data) {
          const name = li.description || 'Unknown';
          unitsByItem[name] = unitsByItem[name] || { name, units: 0, revenue: 0 };
          unitsByItem[name].units += li.quantity || 1;
          unitsByItem[name].revenue += li.amount_total || 0;
        }
      } catch (err) { /* skip a session we cannot expand */ }
    }
    const topItems = Object.values(unitsByItem)
      .map(i => ({ ...i, revenue: money(i.revenue) }))
      .sort((a, b) => b.units - a.units);

    // Recent orders, with the address each one ships to
    const recent = paid.slice(0, 25).map(s => {
      const ship = s.shipping_details || (s.customer_details && s.customer_details.address ? { name: s.customer_details.name, address: s.customer_details.address } : null);
      const a = (ship && ship.address) || {};
      return {
        id: s.id,
        date: new Date(s.created * 1000).toISOString(),
        total: money(s.amount_total || 0),
        shipping: money((s.total_details && s.total_details.amount_shipping) || 0),
        email: (s.customer_details && s.customer_details.email) || '',
        phone: (s.customer_details && s.customer_details.phone) || '',
        name: (ship && ship.name) || (s.customer_details && s.customer_details.name) || '',
        address: [a.line1, a.line2, a.city, a.state, a.postal_code, a.country].filter(Boolean).join(', '),
        note: (s.metadata && s.metadata.note) || '',
        livemode: s.livemode
      };
    });

    const states = {};
    for (const o of recent) {
      const m = o.address.match(/,\s*([A-Z]{2}),\s*\d/);
      if (m) states[m[1]] = (states[m[1]] || 0) + 1;
    }

    return res.status(200).json({
      configured: true,
      testMode: paid.length ? !paid[0].livemode : null,
      days,
      totals: {
        revenue: money(gross),
        orders,
        averageOrder: orders ? money(gross / orders) : 0,
        shipping: money(shippingTotal),
        estimatedFees: money(fees),
        estimatedNet: money(gross - fees)
      },
      series,
      topItems,
      recent,
      shipsTo: Object.entries(states).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count)
    });
  } catch (err) {
    console.error('admin/stats:', err.message);
    return res.status(500).json({ error: 'Could not load sales data' });
  }
});
