# Silk & Stone

Storefront at `/`, admin at `/admin`.

---

## What you need to add in Vercel

Settings → Environments → **Production**. Three variables:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | already set — `sk_test_…` while testing, `sk_live_…` when real |
| `ADMIN_PASSWORD` | whatever you want to type to get into the admin |
| `SESSION_SECRET` | a long random string, 32+ characters — never typed by you, just needs to exist |

For `SESSION_SECRET`, mash the keyboard or run `openssl rand -hex 32` in Terminal.
It signs your login cookie. If you change it, everyone gets logged out — which is
also how you kick out a session you're worried about.

## One service to switch on

The admin saves products and photos to **Vercel Blob**.

Vercel dashboard → **Storage** → **Create Database** → **Blob** → connect it to the
`silk-and-stone` project. Vercel adds the `BLOB_READ_WRITE_TOKEN` variable itself;
you don't copy anything. Free tier is far more than this shop needs.

Redeploy after adding variables — they only apply to new deployments.

---

## How it hangs together

**Until you save anything in the admin**, the shop shows the eleven pieces built
into `index.html`, with the photos embedded in the page. Nothing breaks if Blob
isn't set up yet.

**The first time you press Save**, that catalogue is written to Blob as
`products.json`. From then on it's the live source: the storefront reads it, and
so does checkout.

**Prices are read on the server.** When someone checks out, `api/checkout.js`
looks the price up from the saved catalogue — never from the browser. So nobody
can edit a price before paying, and the price you set in the admin is
exactly what Stripe charges. No more keeping two files in step.

**Photos you upload** are shrunk in your browser to 1400px, then stored in Blob
and referenced by URL. The original eleven pieces still use photos embedded in
the page; both work side by side. As you replace them with uploads, the page
gets smaller and faster.

**Sales figures come from Stripe**, not from any database here. Revenue, order
count, average order, shipping collected, best sellers and shipping addresses
are all read live, so they can't drift from the money that actually arrived.
Fees are an estimate using Stripe's standard 2.9% + 30¢.

---

## Marking something sold

Admin → Products → open the piece → untick **In stock** → Save.

It immediately shows "Sold out" on the site and can't be added to a bag, and
checkout refuses it even if someone had it in their bag already. That last part
matters: it's what stops two people buying the same one-of-a-kind necklace.

## Security notes

- The admin page is one password. Fine for one person; if you ever add someone,
  move to real accounts rather than sharing it.
- Sessions last 12 hours, then you sign in again.
- The login cookie is httpOnly and signed, so it can't be read or forged by a
  page script.
- Login has a deliberate delay, which makes bulk password guessing impractical.
- `/admin` is marked noindex so it won't turn up in search results. That is not
  security — the password is.
- **Never put any of these values in the GitHub repo.** The repo is public.
