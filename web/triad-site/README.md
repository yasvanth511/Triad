# Triad Site

Standalone public marketing website for Triad.

## Local Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

The local dev server uses port `3003`.

## Docker

```bash
docker compose up -d --build triad-site
../../scripts/docker.sh up triad-site
../../scripts/docker.sh logs triad-site
```

The container serves the marketing site on port `3003` by default. Build-time public values use the `SITE_PUBLIC_*` variables listed in `.env.docker.example`.

## Environment Variables

```bash
NEXT_PUBLIC_TRIAD_WEB_APP_URL=
NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=
NEXT_PUBLIC_APP_STORE_URL=
NEXT_PUBLIC_GOOGLE_PLAY_URL=
NEXT_PUBLIC_CONTACT_EMAIL=
```

## Image Deployment

```bash
SITE_IMAGE_REPO=ghcr.io/your-org/triad-site ../../scripts/deploy/site-app.sh
```

Use `SITE_RELEASE_COMMAND` to run a host-specific release hook after the image is pushed.
