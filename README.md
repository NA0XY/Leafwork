# Leafwork

**Free PDF tools that never upload your files for core workflows.**

Merge, split, compress, watermark, sign, redact, rotate, and clean metadata directly in your browser.
Optional AI features are available for summary and conversion workflows.

Live app: [leafworkpdf.vercel.app](https://leafworkpdf.vercel.app)

---

## Tools

| Tool | Description | Account needed? |
|------|-------------|-----------------|
| **Merge** | Combine PDFs in custom order with drag-and-drop | No |
| **Split** | Extract ranges, split every N pages, export as ZIP | No |
| **Compress** | Reduce file size with quality-aware output checks | No |
| **PDF to Images** | Convert selected pages to JPG/PNG | No |
| **Watermark** | Add text or image watermarks with live preview | No |
| **Sign** | Draw, type, or upload signatures and place on pages | No |
| **Redact** | Draw redaction boxes and export a redacted copy | No |
| **Rotate** | Rotate all pages or selected pages with per-page control | No |
| **Metadata Strip** | Remove hidden metadata before sharing | No |
| **PDF to Word** | AI-assisted editable output from extracted text | Yes |
| **Summarize** | AI summary with key points, figures, and actions | Yes |

---

## Architecture

```text
Browser (local processing)
  |- pdf-lib        -> PDF merge/split/rotate/sign/watermark
  |- PDF.js         -> rendering and extraction
  |- JSZip          -> bulk download packaging

Vercel (Next.js 14)
  |- API routes for auth and AI features
  |- Supabase for auth/workflows
  |- Groq for AI inference
  |- Upstash for rate limiting
```

Core PDF operations are local-first in the browser.
AI features send extracted text only after explicit user action.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 + TypeScript |
| PDF engine | pdf-lib |
| Renderer | PDF.js |
| AI | Groq |
| Auth + DB | Supabase |
| Rate limiting | Upstash Redis |
| Hosting | Vercel |
| UI | Tailwind + neobrutalist design system |

---

## Local Development

```bash
git clone https://github.com/yourusername/leafwork
cd leafwork
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Service |
|----------|---------|
| `NEXT_PUBLIC_BASE_URL` | Deployment base URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (server-only) |
| `GROQ_API_KEY` | Groq |
| `UPSTASH_REDIS_REST_URL` | Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash |

---

## Deployment

### Direct Vercel (recommended right now)

If you do not have a domain yet, deploy directly to Vercel and use:
`https://leafworkpdf.vercel.app`

```bash
vercel login
vercel --prod
```

Add all environment variables in:
Vercel Dashboard -> Project -> Settings -> Environment Variables.

### Optional later: Cloudflare + Vercel (Orange Cloud)

When you get a custom domain later, you can put Cloudflare in front of Vercel:

1. Add domain to Cloudflare (free plan)
2. Update registrar nameservers to Cloudflare
3. Set DNS records:
   - `CNAME @ -> cname.vercel-dns.com` (proxy ON)
   - `CNAME www -> cname.vercel-dns.com` (proxy ON)
4. Add domain in Vercel project settings
5. Update `NEXT_PUBLIC_BASE_URL` to your custom domain

This keeps direct Vercel working now and enables edge proxying later.

---

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
ANALYZE=true npm run build
```

---

## Security Contact

See `public/.well-known/security.txt`.

---

## License

MIT
