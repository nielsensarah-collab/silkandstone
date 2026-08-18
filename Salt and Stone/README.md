# Silk & Stone — turning on Stripe

The site works right now with Stripe switched off. Pick one of the two ways
below. Everything you change lives near the top of `index.html`, in the block
marked `const STRIPE = {`.

---

## Option A — Payment Links (no server, ~15 minutes)

Best if you want to take money this week and don't mind buyers paying for one
piece at a time.

1. Make a Stripe account at stripe.com and finish the details it asks for
   (bank account, ID). Payouts start once that's approved.
2. Go to **Payment links → New**. Create one link per piece, using the same
   name and price as the site.
3. Copy each link into `index.html`:

   ```js
   const STRIPE = {
     mode: 'links',
     links: {
       grn: 'https://buy.stripe.com/xxxx',   // Green & red beaded necklace
       mlt: 'https://buy.stripe.com/xxxx',   // Color block necklace
       crd: 'https://buy.stripe.com/xxxx',   // Red cord charm necklace
       amb: 'https://buy.stripe.com/xxxx',   // Amber fish bracelet
       lem: 'https://buy.stripe.com/xxxx',   // Lemon fish bracelet
       pb:  'https://buy.stripe.com/xxxx',   // Paracord bracelet
       phn: 'https://buy.stripe.com/xxxx'    // Paracord heart necklace
     },
     ...
   };
   ```

4. Change `mode` to `'links'`. Each item in the bag now gets its own Pay
   button. Turn on "Collect shipping address" inside each Payment Link.

**Trade-off:** someone buying three pieces pays three times.

---

## Option B — Real checkout (one cart, one payment)

Needs the site hosted somewhere that runs the `api/checkout.js` function.
Vercel is free for this.

1. In `index.html`, set `mode: 'server'`.
2. Deploy this whole folder to Vercel (`vercel deploy`, or drag the folder in
   at vercel.com/new).
3. In Vercel: **Settings → Environment Variables**, add

   ```
   STRIPE_SECRET_KEY = sk_live_...
   ```

   Get that from Stripe under **Developers → API keys**. Use the test key
   (`sk_test_...`) first — test card `4242 4242 4242 4242`, any future expiry.
4. Redeploy. The Check out button now builds a Stripe checkout with every
   piece in the bag, collects a shipping address and phone number, and sends
   the buyer back to the site afterwards.

### Important

- **Never put the secret key in `index.html`.** It belongs only in the Vercel
  environment variable. Anyone with that key can move money in your account.
- Prices are set in `api/checkout.js`, not in the browser. That's deliberate —
  it stops anyone editing a price before paying. **When you change a price on
  the site, change it in `api/checkout.js` too**, or you'll charge the old one.
- Shipping is a flat $5 in `api/checkout.js` (`SHIPPING`). Set it to `null`
  for no shipping.
- The buyer's note arrives on the payment in Stripe under **Metadata → note**.

---

## Editing the shop

All in `index.html`:

- `PRODUCTS` — names, prices, descriptions, which photos, and `inStock`.
  Set `inStock: false` and the piece shows "Sold out" and can't be added.
- `isNew: true` puts a piece in the What's New collection.
- `COLLECTIONS` — the menu and collection pages.

Photos are embedded in the file itself, so there's nothing else to upload.
