FROM node:22-bookworm-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app

ARG NEXT_PUBLIC_TRIAD_WEB_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=http://localhost:3002
ARG NEXT_PUBLIC_APP_STORE_URL=
ARG NEXT_PUBLIC_GOOGLE_PLAY_URL=
ARG NEXT_PUBLIC_CONTACT_EMAIL=hello@triad.app

ENV NEXT_PUBLIC_TRIAD_WEB_APP_URL=$NEXT_PUBLIC_TRIAD_WEB_APP_URL
ENV NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL=$NEXT_PUBLIC_TRIAD_BUSINESS_APP_URL
ENV NEXT_PUBLIC_APP_STORE_URL=$NEXT_PUBLIC_APP_STORE_URL
ENV NEXT_PUBLIC_GOOGLE_PLAY_URL=$NEXT_PUBLIC_GOOGLE_PLAY_URL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p public && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3003

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3003

CMD ["node", "server.js"]
