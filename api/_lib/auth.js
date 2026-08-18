// Shared login/session helper. Files under api/_lib are not routed by Vercel.
//
// How the session works: on a correct password we hand back a cookie holding
// an expiry timestamp plus an HMAC of that timestamp signed with SESSION_SECRET.
// Nothing sensitive is in the cookie, and it cannot be forged without the
// secret. The cookie is httpOnly, so page scripts can never read it.

const crypto = require('crypto');

const COOKIE = 'ss_admin';
const MAX_AGE = 60 * 60 * 12; // 12 hours

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error('SESSION_SECRET missing or too short');
  return s;
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(String(value)).digest('hex');
}

// Constant-time compare so response timing can't be used to guess the password.
function sameString(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function checkPassword(given) {
  const real = process.env.ADMIN_PASSWORD;
  if (!real) throw new Error('ADMIN_PASSWORD is not set');
  return sameString(given || '', real);
}

function issueCookie(res) {
  const exp = Date.now() + MAX_AGE * 1000;
  const token = `${exp}.${sign(exp)}`;
  res.setHeader('Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`);
}

function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

function isLoggedIn(req) {
  try {
    const raw = req.headers.cookie || '';
    const hit = raw.split(';').map(c => c.trim()).find(c => c.startsWith(COOKIE + '='));
    if (!hit) return false;
    const [exp, mac] = hit.slice(COOKIE.length + 1).split('.');
    if (!exp || !mac) return false;
    if (Number(exp) < Date.now()) return false;
    return sameString(mac, sign(exp));
  } catch (err) {
    return false;
  }
}

// Wrap any admin handler with this. Returns 401 unless the session is valid.
function requireAdmin(handler) {
  return async (req, res) => {
    // Never let a browser cache an admin response. Without this, the "not
    // signed in" 401 gets stored, revalidates as a 304, and the browser
    // replays the old 401 — which looks exactly like being logged straight
    // back out after a successful sign-in.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    if (!isLoggedIn(req)) return res.status(401).json({ error: 'Not signed in' });
    return handler(req, res);
  };
}

module.exports = { checkPassword, issueCookie, clearCookie, isLoggedIn, requireAdmin };
