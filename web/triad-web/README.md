# Triad Web

Responsive Next.js web client for the existing Triad iOS-native product.

## What This App Covers

- Auth flow with sign in and registration
- Discover, Saved, Matches, Impress Me, Events, Notifications, and Profile routes
- Dedicated profile detail and profile edit flows
- Shared design system aligned to the iOS visual language
- API integration against the existing `ThirdWheel.API` endpoints
- PWA preparation via `manifest.ts`, generated app icons, and standalone metadata

## Local Setup

1. Copy the env file:

```bash
cp .env.example .env.local
```

2. Point `NEXT_PUBLIC_API_ORIGIN` at the existing API host.

3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

## Docker

Build and run the web app from the repo root with:

```bash
./scripts/docker.sh up web
```

Or directly through Compose:

```bash
docker compose up -d --build web
```

The container expects `WEB_PUBLIC_API_ORIGIN` to point at the browser-visible API origin. For local Docker development the default is `http://localhost:5127`.

## Notes

- This app is intentionally isolated from the existing `admin/`, `backend/`, and `IOSNative/` projects.
- Native-only adaptations are marked with TODO banners where web-specific behavior still needs a fuller implementation path.
- The first pass focuses on route parity, brand fidelity, reusable primitives, and maintainable structure rather than complete feature parity for every native-only capability.
