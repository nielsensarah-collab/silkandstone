// Admin: draft a product description from one of its photos.
//
// Runs through Vercel's AI Gateway, so it uses the Vercel account you already
// have rather than a separate AI provider. Set AI_GATEWAY_API_KEY in the
// project's environment variables to switch it on; without it the button
// simply reports that it is not configured.
//
// The draft is a starting point, never the final word — the admin drops it
// into the description box for you to edit.

const { requireAdmin } = require('../_lib/auth');

const ENDPOINT = 'https://ai-gateway.vercel.sh/v1/chat/completions';
const MODEL = process.env.DESCRIBE_MODEL || 'anthropic/claude-opus-5';

const SYSTEM = `You write product descriptions for a one-woman handmade jewellery
shop called Silk & Stone. House style:

- Two or three sentences. No headings, no bullet points, no marketing slogans.
- Describe what is actually visible: colours, bead shapes, finish, what hangs
  where, roughly how it would sit on the body.
- One concrete, human observation is worth more than three adjectives. Compare
  colours to real things a person would recognise.
- Warm and plain-spoken. First person occasionally ("the one I reach for") is
  fine. Never gushing, never "elevate your look", never "perfect for any
  occasion".
- Do NOT state materials you cannot verify from the photo. Say "gold clasp",
  never "14k gold" or "gold-filled". Do not invent measurements, prices,
  gemstone names or care claims.
- Return only the description text.`;

module.exports = requireAdmin(async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.AI_GATEWAY_API_KEY) {
    return res.status(501).json({
      error: 'Drafting is not set up yet — add AI_GATEWAY_API_KEY in Vercel to switch it on'
    });
  }

  try {
    const { photo, title = '', hint = '' } = req.body || {};
    if (!photo) return res.status(400).json({ error: 'Upload a photo first' });

    // photos stored on this site come through as /photos/x.jpg
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const url = photo.startsWith('/') ? origin + photo : photo;

    const ask = [
      title && `The piece is called "${title}".`,
      hint && `Notes from the maker: ${hint}`,
      'Write the description.'
    ].filter(Boolean).join(' ');

    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: ask },
            { type: 'image_url', image_url: { url } }
          ] }
        ]
      })
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('describe gateway error', r.status, detail.slice(0, 300));
      return res.status(502).json({ error: 'The drafting service turned that down — try again' });
    }

    const data = await r.json();
    const text = (data.choices && data.choices[0] && data.choices[0].message &&
                  data.choices[0].message.content || '').trim();

    if (!text) return res.status(502).json({ error: 'No draft came back — try again' });
    return res.status(200).json({ draft: text });
  } catch (err) {
    console.error('describe:', err.message);
    return res.status(500).json({ error: 'Could not draft a description' });
  }
});
