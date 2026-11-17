# The public site. Next.js in standalone mode: the build traces the files the server actually
# imports and copies just those, so the runtime image carries a server and its dependencies
# rather than a node_modules tree.
#
# Nothing secret is baked in. The API key and base URL are read from the environment at run
# time, which is what lets the same image run in preview and in production - and what stops a
# key from ending up in a layer that outlives the key.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Not root. The site talks to the API over the network and needs nothing else on this box.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
# The IndexNow submitter, which the deploy runs inside this container once the release is serving
# (infra/deploy/deploy.sh). Plain Node with no imports, so it needs nothing the standalone trace
# did not already bring - but it does have to be in the image to be run.
COPY --from=build --chown=nextjs:nodejs /app/scripts/indexnow.mjs ./scripts/indexnow.mjs

# Where the AI budget and the delivery receipts live, mounted as the `site_state` volume by
# infra/docker-compose.yml. Created here, owned by `nextjs`, because Docker seeds a fresh named
# volume from the image - so the running container finds a directory it can already write to,
# with no chown on the host. Without this the volume would arrive owned by root and the site,
# which runs as uid 1001, could not write a receipt.
RUN mkdir -p /var/lib/npimark && chown nextjs:nodejs /var/lib/npimark

USER nextjs
EXPOSE 3000

# Liveness, not readiness. This used to fetch the homepage, which renders server-side and
# calls the provider API to do it - so the check tested the whole stack on a 3-second
# budget. On 21 October crawlers pushed renders to 60-125 seconds, every check timed out,
# the container was marked unhealthy and the edge stopped routing to it: a slow site
# became a 502 for everybody, including a sign-in page that renders in 7 milliseconds.
#
# /healthz touches nothing and answers immediately. 5s rather than 3 so a busy event loop
# gets a moment, and the question it answers is the right one - should this container be
# replaced - rather than whether the API is quick today.
HEALTHCHECK --interval=10s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
