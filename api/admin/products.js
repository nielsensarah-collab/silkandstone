// Admin: read and save the catalogue.
const { requireAdmin } = require('../_lib/auth');
const { readProducts, writeProducts } = require('../_lib/store');

const clean = p => ({
  id: String(p.id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 24),
  title: String(p.title || '').trim().slice(0, 120),
  price: Math.max(0, Math.round(Number(p.price) * 100) / 100),
  inStock: p.inStock !== false,
  isNew: !!p.isNew,
  cols: Array.isArray(p.cols) ? p.cols.slice(0, 6).map(String) : [],
  swatch: String(p.swatch || '').slice(0, 120),
  desc: String(p.desc || '').slice(0, 2000),
  spec: Array.isArray(p.spec) ? p.spec.slice(0, 10).map(r => [String(r[0] || '').slice(0, 40), String(r[1] || '').slice(0, 160)]) : [],
  photos: Array.isArray(p.photos) ? p.photos.slice(0, 8).map(String) : []
});

module.exports = requireAdmin(async (req, res) => {
  try {
    if (req.method === 'GET') {
      const { products, source } = await readProducts();
      return res.status(200).json({ products, source });
    }

    if (req.method === 'PUT') {
      const incoming = (req.body && req.body.products) || [];
      if (!Array.isArray(incoming) || !incoming.length) return res.status(400).json({ error: 'No products supplied' });
      if (incoming.length > 200) return res.status(400).json({ error: 'Too many products' });

      const products = incoming.map(clean);
      for (const p of products) {
        if (!p.id) return res.status(400).json({ error: 'Every piece needs an ID' });
        if (!p.title) return res.status(400).json({ error: `"${p.id}" needs a name` });
      }
      const ids = products.map(p => p.id);
      const dupe = ids.find((id, i) => ids.indexOf(id) !== i);
      if (dupe) return res.status(400).json({ error: `Two pieces share the ID "${dupe}"` });

      await writeProducts(products);
      return res.status(200).json({ ok: true, count: products.length });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('admin/products:', err.message);
    return res.status(500).json({ error: err.message || 'Could not save' });
  }
});
