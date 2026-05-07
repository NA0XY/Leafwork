# Leafwork

Leafwork is a privacy-first document toolkit built with Next.js. It combines local PDF utilities with optional AI-assisted workflows so users can process files quickly while keeping sensitive data protected.

## What It Includes

- Local-first PDF tools: merge, split, rotate, compress, redact, watermark, sign, metadata strip, and PDF-to-images.
- AI routes for document intelligence: summarize, detect PII, extract tables, legibility check, and PDF-to-Word assistance.
- Auth-enabled dashboard workflows backed by Supabase.
- Request rate limiting with Upstash Redis.

## Tech Stack

- Next.js 14 + TypeScript
- React + Tailwind CSS
- Supabase
- Upstash Redis + `@upstash/ratelimit`
- Groq SDK

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`.
3. Start development server:
   ```bash
   npm run dev
   ```

## Repository Description (Short)

Privacy-first PDF toolkit with local processing and AI-assisted document workflows.
