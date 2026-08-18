// Admin: store a photo in Blob and hand back its URL.
// The admin page shrinks images before sending, so bodies stay small.
const { requireAdmin } = require('../_lib/auth');
const { put } = require('@vercel/blob');

module.exports = requireAdmin(async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  try {
    const { filename, data } = req.body || {};
    if (!data) return res.status(400).json({ error: 'No image supplied' });

    const base64 = String(data).replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    if (buf.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'Image is too large' });

    const safe = String(filename || 'photo.jpg').toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 60);
    const { url } = await put(`photos/${Date.now()}-${safe}`, buf, {
      access: 'public',
      contentType: 'image/jpeg'
    });
    return res.status(200).json({ url });
  } catch (err) {
    console.error('admin/upload:', err.message);
    return res.status(500).json({ error: 'Upload failed' });
  }
});
