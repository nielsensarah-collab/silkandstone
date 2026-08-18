# Silk & Stone

Storefront at `/`, admin at `/admin.html`.

## Environment variables (Vercel → Settings → Environments → Production)

| Name | What it is |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_…` while testing, `sk_live_…` when real |
| `ADMIN_PASSWORD` | what you type to get into the admin |
| `SESSION_SECRET` | long random string; signs your login cookie |
| `BLOB_READ_WRITE_TOKEN` | added automatically when you connect Blob storage |

Environment variables only apply to deployments made *after* they are added, so
redeploy whenever you change one.

## How it works

Until you save in the admin, the shop shows the eleven pieces built into
`index.html`. The first save writes them to Blob storage, and from then on that
is the live catalogue — read by the storefront *and* by checkout.

Prices are looked up on the server at checkout, never taken from the browser.
So the price in the admin is exactly what Stripe charges, and unticking
"In stock" genuinely blocks the sale even if the piece is already in a bag.

Sales figures are read live from Stripe rather than stored here, so they can
never drift from the money that actually arrived. Fees shown are an estimate
at Stripe's standard 2.9% + 30¢.

## Marking something sold

Admin → Products → open the piece → untick **In stock** → Save.

## Security

- One password protects the admin. Sessions last 12 hours.
- The login cookie is httpOnly and signed, so page scripts cannot read or forge it.
- Admin responses are sent `no-store` so no browser or CDN ever caches them.
- Never commit any of these values to the repo. It is public.
