// Public: the storefront reads its catalogue from here.
const { readProducts } = require('./_lib/store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const { products, source } = await readProducts();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ products, source });
  } catch (err) {
    console.error('products:', err.message);
    return res.status(500).json({ error: 'Could not load products' });
  }
};
