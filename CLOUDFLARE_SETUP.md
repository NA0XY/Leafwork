# Cloudflare Orange Cloud Setup
> Complete this after you have a custom domain.
> Currently running on: https://leafworkpdf.vercel.app

## What the Orange Cloud gives you
- Global edge CDN for static asset caching.
- DDoS protection before requests hit Vercel.
- Free SSL termination at Cloudflare edge.
- Hides your Vercel origin endpoint.
- Reduces Vercel bandwidth load for cached assets.

## Step 1 - Get a domain
1. Go to https://education.github.com/pack
2. Verify student status.
3. Claim a free domain via Namecheap or Name.com.
4. Suggested targets: `leafworkpdf.me` or `leafworkpdf.tech`.

## Step 2 - Add domain to Cloudflare
1. Go to https://cloudflare.com and add your domain.
2. Choose the Free plan.
3. Cloudflare gives two nameservers.
4. Update nameservers at your registrar.
5. Wait for DNS propagation.

## Step 3 - DNS records pointing to Vercel
Add these records in Cloudflare DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | @ | `cname.vercel-dns.com` | ON (orange cloud) |
| CNAME | www | `cname.vercel-dns.com` | ON (orange cloud) |

## Step 4 - Add domain in Vercel
1. Vercel dashboard -> Project -> Settings -> Domains.
2. Add root domain and `www` domain.
3. Wait for Vercel verification.

## Step 5 - Cloudflare Page Rules (free tier)
1. `leafworkpdf.me/workers/*`
   Cache Level: Cache Everything
   Edge TTL: 1 month

2. `leafworkpdf.me/_next/static/*`
   Cache Level: Cache Everything
   Edge TTL: 1 year

3. `leafworkpdf.me/*`
   Security Level: Medium
   Browser Cache TTL: 4 hours

## Step 6 - Update Vercel environment variable
Set in Vercel:
`NEXT_PUBLIC_BASE_URL = https://leafworkpdf.me`

Redeploy:
`vercel --prod`

## Step 7 - Update Supabase redirects
Add in Supabase Auth URL Configuration:
- `https://leafworkpdf.me/api/auth/callback`
- `https://leafworkpdf.me/**`

Keep existing `leafworkpdf.vercel.app` entries for fallback.

## Result
Traffic is proxied through Cloudflare globally, static assets are edge-cached,
and Vercel primarily serves dynamic/API routes.
