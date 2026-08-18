const { checkPassword, issueCookie, clearCookie, isLoggedIn } = require('../_lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  // GET tells the admin page whether we are already signed in
  if (req.method === 'GET') return res.status(200).json({ signedIn: isLoggedIn(req) });

  if (req.method === 'DELETE') { clearCookie(res); return res.status(200).json({ ok: true }); }

  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST, DELETE'); return res.status(405).json({ error: 'Method not allowed' }); }

  try {
    const { password } = req.body || {};
    // A deliberate pause: makes guessing passwords in bulk impractical.
    await new Promise(r => setTimeout(r, 600));
    if (!checkPassword(password)) return res.status(401).json({ error: 'Wrong password' });
    issueCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('login:', err.message);
    return res.status(500).json({ error: 'Login is not configured yet' });
  }
};
